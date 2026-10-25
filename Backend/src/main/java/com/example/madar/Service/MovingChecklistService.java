package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Client.OpenRouterClient;
import com.example.madar.DTO.Out.Moving.MovingAiDTO;
import com.example.madar.DTO.Out.Moving.MovingChecklistDTO;
import com.example.madar.DTO.Out.Moving.MovingTaskDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Model.MovingTask;
import com.example.madar.Model.User;
import com.example.madar.Repository.CurrentHomeRepository;
import com.example.madar.Repository.MovingTaskRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MovingChecklistService {

    private final MovingTaskRepository movingTaskRepository;
    private final UserRepository userRepository;
    private final CurrentHomeRepository currentHomeRepository;
    private final PropertyService propertyService;
    private final OpenRouterClient openRouterClient;

    //rules for the AI: tasks from the listing only, never invent features
    private static final String RULES = """
            You help a person who is moving into a new home in Saudi Arabia. You get the data of the home's listing.
            Write short moving tasks for this home only.
            Rules:
            - Use only the listing data. Never say the home has something unless the description says it.
            - If the description already says something (like the rent includes water and electricity, or the home is furnished), never write a task to check or ask about it.
            - If an important thing is not mentioned in the description (air conditioners, water heaters, kitchen, parking, separate electricity meter, furniture), write a task to ask the owner about it.
            - If the description says the home is not furnished, or does not mention furniture, write a task to prepare furniture for the bedrooms, using the bedrooms number from the data.
            - Do not write tasks about the national address, electricity and water, or internet. They are already in the list.
            - Do not write tasks about places around the home, like pharmacies, supermarkets or schools.
            - Write at most 5 tasks. Each task is one short line.
            - Write numbers in English digits.
            - titleAr is in friendly white Saudi dialect, like "اسأل المالك عن السخانات". titleEn is the same task in English.
            """;

    //each topic: words that show a task is about it (same order in both lists)
    private static final List<String[]> TASK_TOPICS = List.of(
            new String[]{"مطبخ", "kitchen"},
            new String[]{"مكيف", "تكييف", "air condition"},
            new String[]{"سخان", "heater"},
            new String[]{"موقف", "parking"},
            new String[]{"اثاث", "مؤثث", "furni"},
            new String[]{"كهرباء", "electric"},
            new String[]{"مصعد", "elevator"}
    );
    //each topic: words that show the description already mentions it
    private static final List<String[]> DESCRIPTION_TOPICS = List.of(
            new String[]{"مطبخ", "kitchen"},
            new String[]{"مكيف", "تكييف", "air condition"},
            new String[]{"سخان", "heater"},
            new String[]{"موقف", "مواقف", "parking"},
            new String[]{"مؤثث", "مفروش", "اثاث", "furnished"},
            new String[]{"كهرباء", "electric"},
            new String[]{"مصعد", "اسانسير", "elevator"}
    );

    //build the checklist once: fixed tasks + AI tasks from the Kite listing
    @Transactional
    public void generateChecklist(Integer userId){
        User user = userRepository.findUserById(userId);
        if(user == null){
            throw new ApiException("User not found");
        }
        CurrentHome home = currentHomeRepository.findCurrentHomeByUser_Id(userId);
        if(home == null){
            throw new ApiException("Please add your current home first");
        }
        if(movingTaskRepository.existsByUser_Id(userId)){
            throw new ApiException("Moving checklist already exists");
        }
        //the moving checklist is for before moving in
        if(home.getMovedInAt() != null){
            throw new ApiException("You already moved in, the moving checklist is for before moving");
        }

        //the listing of the home, only if it was chosen from Madar listings
        PropertyDTO property = null;
        if(home.getExternalPropertyId() != null && home.getSource() != null){
            try{
                property = propertyService.getPropertyById(home.getSource(), home.getExternalPropertyId());
            }catch (Exception e){
                System.out.println("Moving listing not found: " + e.getMessage());
            }
        }

        List<MovingTask> tasks = new ArrayList<>();
        //fixed tasks: same for everyone, written in Java so they are always correct
        tasks.add(newTask("تحديث العنوان الوطني", "Update your national address", "FIXED", user));
        //the rent includes water and electricity: no need to transfer them
        if(!utilitiesIncluded(property)){
            tasks.add(newTask("نقل خدمات الكهرباء والمياه باسمك", "Transfer electricity and water to your name", "FIXED", user));
        }
        tasks.add(newTask("تجهيز خدمة الإنترنت", "Set up the internet", "FIXED", user));

        //AI tasks from the listing description
        if(property != null){
            tasks.addAll(aiTasks(property, user));
        }

        for(int i = 0; i < tasks.size(); i++){
            tasks.get(i).setSortOrder(i + 1);
        }
        movingTaskRepository.saveAll(tasks);
    }


    public MovingChecklistDTO getChecklist(Integer userId, String lang){
        if(userRepository.findUserById(userId) == null){
            throw new ApiException("User not found");
        }
        List<MovingTask> tasks = movingTaskRepository.findMovingTasksByUser_IdOrderBySortOrder(userId);
        if(tasks.isEmpty()){
            throw new ApiException("Moving checklist not found, generate it first");
        }

        List<MovingTaskDTO> movingTasks = new ArrayList<>();
        List<MovingTaskDTO> ownerChecks = new ArrayList<>();
        int done = 0;
        int aiLeft = 0;
        for(MovingTask task : tasks){
            String title = task.getTitleAr();
            if("en".equalsIgnoreCase(lang)){
                title = task.getTitleEn();
            }
            MovingTaskDTO dto = new MovingTaskDTO(task.getId(), title, task.getSource(), task.getDone());
            //AI tasks go to their own group
            if(task.getSource().equals("AI")){
                ownerChecks.add(dto);
                if(!Boolean.TRUE.equals(task.getDone())){
                    aiLeft++;
                }
            }else{
                movingTasks.add(dto);
            }
            if(Boolean.TRUE.equals(task.getDone())){
                done++;
            }
        }

        //a short note above the owner checks (null if there are none)
        String note = null;
        if(!ownerChecks.isEmpty()){
            if(aiLeft > 0){
                note = "باقي " + aiLeft + " أمور ما ذكرها المالك في الإعلان، تأكد منها معه.";
                if("en".equalsIgnoreCase(lang)){
                    note = aiLeft + " things were not mentioned in the listing. Check them with the owner.";
                }
            }else{
                note = "تأكدت من كل شي مع المالك 👍";
                if("en".equalsIgnoreCase(lang)){
                    note = "You checked everything with the owner 👍";
                }
            }
        }
        return new MovingChecklistDTO(done, tasks.size(), movingTasks, note, ownerChecks);
        }

    //check or uncheck one task
    public void toggleTask(Integer userId, Integer taskId){
        MovingTask task = movingTaskRepository.findMovingTaskByIdAndUser_Id(taskId, userId);
        if(task == null){
            throw new ApiException("Task not found for this user");
        }
        task.setDone(!Boolean.TRUE.equals(task.getDone()));
        movingTaskRepository.save(task);
    }

    //delete my checklist, so I can generate a new one (like after changing my home)
    @Transactional
    public void resetChecklist(Integer userId){
        List<MovingTask> tasks = movingTaskRepository.findMovingTasksByUser_IdOrderBySortOrder(userId);
        if(tasks.isEmpty()){
            throw new ApiException("Moving checklist not found");
        }
        movingTaskRepository.deleteAll(tasks);
    }


    /////Helper methods/////

    //ask the AI for tasks from the listing; if anything fails, the checklist still works without them
    private List<MovingTask> aiTasks(PropertyDTO property, User user){
        List<MovingTask> tasks = new ArrayList<>();
        try{
            String description = property.getDescription();
            if(description == null || description.isBlank()){
                description = "لا يوجد وصف";
            }
            //keep the request small
            if(description.length() > 1500){
                description = description.substring(0, 1500);
            }

            String data = "بيانات الإعلان:\n"
                    + "- نوع العقار: " + property.getPropertyType() + "\n"
                    + "- نوع الإعلان: " + property.getListingType() + "\n"
                    + "- عدد الغرف: " + valueOrMissing(property.getBedrooms()) + "\n"
                    + "- دورات المياه: " + valueOrMissing(property.getBathrooms()) + "\n"
                    + "- المساحة: " + (property.getAreaSqm() == null ? "غير مذكورة" : Math.round(property.getAreaSqm()) + " متر مربع") + "\n"
                    + "- وصف المالك: " + description;

            MovingAiDTO answer = openRouterClient.askFor(RULES, data, MovingAiDTO.class);
            if(answer == null || answer.getTasks() == null){
                return tasks;
            }

            for(MovingAiDTO.AiTask aiTask : answer.getTasks()){
                if(tasks.size() >= 5){
                    break;
                }
                //skip empty or too long tasks
                if(aiTask.getTitleAr() == null || aiTask.getTitleAr().isBlank() || aiTask.getTitleAr().length() > 200
                        || aiTask.getTitleEn() == null || aiTask.getTitleEn().isBlank() || aiTask.getTitleEn().length() > 200){
                    continue;
                }
                //every number in the task must be from the listing data
                if(!numbersAreFrom(aiTask.getTitleAr() + " " + aiTask.getTitleEn(), data)){
                    System.out.println("Moving task rejected (number): " + aiTask.getTitleAr());
                    continue;
                }
                //the description already mentions this topic: the task is not needed
                if(alreadyMentioned(aiTask.getTitleAr() + " " + aiTask.getTitleEn(), property.getDescription())){
                    System.out.println("Moving task removed (already in description): " + aiTask.getTitleAr());
                    continue;
                }
                tasks.add(newTask(aiTask.getTitleAr().trim(), aiTask.getTitleEn().trim(), "AI", user));
            }
        }catch (Exception e){
            System.out.println("Moving AI tasks skipped: " + e.getMessage());
        }
        return tasks;
    }

    //create one task (sortOrder is set later)
    private MovingTask newTask(String titleAr, String titleEn, String source, User user){
        MovingTask task = new MovingTask();
        task.setTitleAr(titleAr);
        task.setTitleEn(titleEn);
        task.setSource(source);
        task.setDone(false);
        task.setUser(user);
        return task;
    }

    //true if the owner wrote that the rent includes water and electricity
    private boolean utilitiesIncluded(PropertyDTO property){
        if(property == null || property.getDescription() == null){
            return false;
        }
        String text = property.getDescription().toLowerCase();
        return (text.contains("شامل") && text.contains("كهرباء") && !text.contains("غير شامل"))
                || text.contains("utilities included") || text.contains("bills included");
    }

    //true if the task is about something the description already says (and not "بدون" or "غير")
    private boolean alreadyMentioned(String task, String description){
        if(description == null || description.isBlank()){
            return false;
        }
        String taskText = simple(task);
        String descText = simple(description);
        for(int i = 0; i < TASK_TOPICS.size(); i++){
            boolean taskIsAboutIt = false;
            for(String word : TASK_TOPICS.get(i)){
                if(taskText.contains(simple(word))){
                    taskIsAboutIt = true;
                }
            }
            if(!taskIsAboutIt){
                continue;
            }
            for(String word : DESCRIPTION_TOPICS.get(i)){
                String w = simple(word);
                //mentioned, and not like "غير مؤثثة" or "بدون مطبخ"
                if(descText.contains(w) && !descText.contains("غير " + w) && !descText.contains("بدون " + w)
                        && !descText.contains("بلا " + w) && !descText.contains("no " + w) && !descText.contains("un" + w)){
                    return true;
                }
            }
        }
        return false;
    }

    //make the text simple: lower case, أ إ آ = ا, ة = ه
    private String simple(String text){
        return text.toLowerCase().replaceAll("[أإآ]", "ا").replace("ة", "ه");
    }

    //every number in the text must exist in the data (Arabic digits like ٣ count as 3)
    private boolean numbersAreFrom(String text, String data){
        String arabic = "٠١٢٣٤٥٦٧٨٩";
        for(int i = 0; i < 10; i++){
            data = data.replace(arabic.charAt(i), (char) ('0' + i));
        }
        Matcher matcher = Pattern.compile("\\d+").matcher(text);
        while(matcher.find()){
            if(!data.contains(matcher.group())){
                return false;
            }
        }
        return true;
    }

    //"غير مذكور" when the listing has no value
    private String valueOrMissing(Integer value){
        if(value == null){
            return "غير مذكور";
        }
        return value.toString();
    }
}