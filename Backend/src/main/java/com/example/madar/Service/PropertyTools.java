package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.Property.MatchSummaryDTO;
import com.example.madar.DTO.Out.Property.PriceStatsDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.PlacePreference;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.PlacePreferenceRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

//tools the chatbot can call, one object per user message
public class PropertyTools {

    private final PropertyService propertyService;
    private final HousingPreferenceRepository housingPreferenceRepository;
    private final PlacePreferenceRepository placePreferenceRepository;
    private final Integer userId;
    private List<PropertyDTO> lastProperties = new ArrayList<>();
    private List<PropertyDTO> previousCards = new ArrayList<>();
    private String usedData = "";
    private String cityFromMessage;
    private static final String UNEXPECTED_ERROR = "Error: something went wrong while searching, try again";



    public PropertyTools(PropertyService propertyService, HousingPreferenceRepository housingPreferenceRepository,
                         PlacePreferenceRepository placePreferenceRepository, Integer userId){
        this.propertyService = propertyService;
        this.housingPreferenceRepository = housingPreferenceRepository;
        this.placePreferenceRepository = placePreferenceRepository;
        this.userId = userId;
    }


    public List<PropertyDTO> getLastProperties(){
        return lastProperties;
    }


    public String getUsedData(){
        return usedData;
    }



    public void setCityFromMessage(String cityFromMessage){
        this.cityFromMessage = cityFromMessage;
    }


    public void setPreviousCards(List<PropertyDTO> previousCards){
        if(previousCards != null){
            this.previousCards = previousCards;
        }
    }




    /////Tools/////

    @Tool(description = "Get the user's saved housing preference: city, district, budget, property type and listing type")
    public String myPreference(){
        try{
            HousingPreference p = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
            if(p == null){
                return "The user has no housing preference yet";
            }
            String district = "not chosen";
            if(p.getDistrict() != null && !p.getDistrict().isEmpty()){
                district = p.getDistrict();
            }
            return track("city=" + p.getCity() + ", district=" + district + ", budget=" + p.getMaxBudget().intValue()
                    + ", propertyType=" + p.getPropertyType() + ", listingType=" + p.getListingType());
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "Get the user's important places (work, university, family...) with their coordinates")
    public String myPlaces(){
        try{
            System.out.println("myPlaces called for user " + userId);
            List<PlacePreference> places = placePreferenceRepository.findPlacePreferencesByUser_Id(userId);
            if(places.isEmpty()){
                return "The user has no important places saved";
            }
            String result = "";
            for(PlacePreference place : places){
                result += "name=" + place.getName() + ", type=" + place.getType() + ", latitude=" + place.getLatitude()
                        + ", longitude=" + place.getLongitude() + ", visitsPerWeek=" + place.getVisitPerWeek() + "\n";
            }
            return track(result);
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "The user's position in the market: budget, how many listings fit the budget in the city and in the user's district, and the cheapest one")
    public String myMarketSummary(){
        try{
            MatchSummaryDTO match = propertyService.getMatchSummary(userId);
            String result = "ميزانية المستخدم: " + match.getBudget() + " ريال\n"
                    + "عدد العقارات اللي تناسب ميزانيته في المدينة كلها: " + match.getTotalListings() + "\n";
            if(match.getInMyDistrict() != null){
                result += "عدد العقارات اللي تناسب ميزانيته في الحي اللي اختاره: " + match.getInMyDistrict() + "\n";
            }
            if(match.getCheapestPrice() != null){
                result += "أرخص عقار يناسب ميزانيته في المدينة كلها (وليس في حيه بالضرورة): " + match.getCheapestPrice() + " ريال\n";
            }
            return track(result);
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "Find the exact district names in a city that contain a text. Use it before compareDistricts if you are not sure about the district name, or after a 'District not found' error")
    public String findDistricts(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                                @ToolParam(description = "part of the district name, like الحرمين") String text){
        try{
            city = orPreference(city, "city");
            System.out.println("findDistricts called: city=" + city + ", text=" + text);
            List<String> names = propertyService.searchDistricts(city, text);
            if(names.isEmpty()){
                return track("لا يوجد أي حي في " + city + " اسمه يحتوي على: " + text
                        + ". قل للمستخدم إن هذا الحي غير موجود في بياناتنا لهذه المدينة، ولا تقترح أي أسماء أحياء أو أرقام من عندك أبداً.");
            }
            return track("الأحياء الموجودة في " + city + " (اكتبها للمستخدم بنفس الشكل بالضبط ولا تضف عليها): " + String.join("، ", names));
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "Use this for ANY question about prices in a city (cheapest, most expensive, how many listings). It does not give an average. City, listing type and property type are optional, the user's preference is used if they are empty")
    public String priceStats(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                             @ToolParam(description = "rent or sale", required = false) String listingType,
                             @ToolParam(description = "apartment, villa, floor, duplex or building", required = false) String propertyType){
        try{
            city = orPreference(city, "city");
            listingType = orPreference(listingType, "listingType");
            propertyType = orPreference(propertyType, "propertyType");

            PriceStatsDTO stats = propertyService.getPriceStats(city, listingType, propertyType);
            return track("إجمالي إعلانات " + stats.getPropertyType() + " في " + stats.getCity() + " بكل الأسعار: " + stats.getTotalListings() + "\n"
                    + "أرخص سعر في السوق: " + stats.getMinPrice() + " ريال\n"
                    + "أغلى سعر في السوق: " + stats.getMaxPrice() + " ريال");
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "Listings that match the user's preference inside the user's district")
    public Object myDistrictProperties(){
        try{
            return remember(propertyService.getByPreferenceInMyDistrict(userId));
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    @Tool(description = "Listings within the user's budget in the whole city")
    public Object withinMyBudget(){
        try{
            return remember(propertyService.getWithinBudget(userId));
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }



    @Tool(description = "Search listings by price: up to a maximum yearly price, with an optional minimum price. If the user mentioned a district, you MUST put it in districts. City, listing type and property type are optional, the user's preference is used if they are empty")
    public Object priceRange(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                             @ToolParam(description = "rent or sale", required = false) String listingType,
                             @ToolParam(description = "apartment, villa, floor, duplex, building or all", required = false) String propertyType,
                             @ToolParam(description = "minimum price in SAR, optional (leave empty if the user did not say)", required = false) Integer minPrice,
                             @ToolParam(description = "maximum yearly price in SAR. Leave it EMPTY when the user says my budget, my cost or within my budget: the user's saved budget is used", required = false) Integer maxPrice,
                             @ToolParam(description = "Arabic district names separated by comma, like النرجس. Required if the user mentioned a district", required = false) String districts){
        try{
            city = orPreference(city, "city");
            listingType = orPreference(listingType, "listingType");
            propertyType = orPreference(propertyType, "propertyType");
            if(minPrice == null){
                minPrice = 0;
            }
            //no price from the user: use the budget from the housing preference
            if(maxPrice == null){
                HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
                if(preference == null || preference.getMaxBudget() == null){
                    return "Error: ask the user for a maximum price";
                }
                maxPrice = preference.getMaxBudget().intValue();
                usedData += "ميزانية المستخدم: " + maxPrice + " ريال\n";
            }
            System.out.println("priceRange called: city=" + city + ", type=" + propertyType + ", min=" + minPrice + ", max=" + maxPrice);

            //the user asked for a district: search only inside it
            if(districts != null && !districts.isBlank()){
                List<PropertyDTO> inDistricts = remember(propertyService.getByDistrictsAndPrice(city, listingType, propertyType, districts, minPrice, maxPrice));
                if(inDistricts.isEmpty()){
                    return track("لا توجد إعلانات في " + districts + " بين " + minPrice + " و " + maxPrice + " ريال حالياً");
                }
                return inDistricts;
            }

            List<PropertyDTO> found = remember(propertyService.getByPriceRange(city, listingType, propertyType, minPrice, maxPrice));
            if(found.isEmpty()){
                return track("لا توجد إعلانات " + propertyType + " في " + city + " بين " + minPrice + " و " + maxPrice + " ريال حالياً. قل هذا للمستخدم بدون ذكر أي أسعار ثانية، واقترح عليه يرفع الميزانية أو يغير النوع.");
            }
            return found;
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }



    @Tool(description = "Listings near a point (latitude, longitude) within a radius in km, nearest first. Use coordinates from myPlaces, never guess them. If the user also says my budget or within my budget, set withinMyBudget to true. City, listing type and property type are optional, the user's preference is used if they are empty")
    public Object nearLocation(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                               @ToolParam(description = "rent or sale", required = false) String listingType,
                               @ToolParam(description = "apartment, villa, floor, duplex, building or all", required = false) String propertyType,
                               @ToolParam(description = "latitude of the point") Double latitude,
                               @ToolParam(description = "longitude of the point") Double longitude,
                               @ToolParam(description = "radius in km, from 1 to 50") Double radiusKm,
                               @ToolParam(description = "true if the user wants listings within the saved budget", required = false) Boolean withinMyBudget,
                               @ToolParam(description = "maximum yearly price in SAR if the user said a number", required = false) Integer maxPrice){
        try{
            city = orPreference(city, "city");
            listingType = orPreference(listingType, "listingType");
            propertyType = orPreference(propertyType, "propertyType");

            //"within my budget": take the budget from the housing preference
            if(maxPrice == null && Boolean.TRUE.equals(withinMyBudget)){
                HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
                if(preference != null && preference.getMaxBudget() != null){
                    maxPrice = preference.getMaxBudget().intValue();
                    usedData += "ميزانية المستخدم: " + maxPrice + " ريال\n";
                }
            }
            System.out.println("nearLocation called: city=" + city + ", radius=" + radiusKm + ", max=" + maxPrice);
            List<PropertyDTO> found = remember(propertyService.getNearLocationWithPrice(city, listingType, propertyType, latitude, longitude, radiusKm, maxPrice));

            //no budget used: the code checks the prices and tells the AI if it should offer the budget filter
            if(maxPrice == null){
                HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
                if(preference != null && preference.getMaxBudget() != null){
                    int budget = preference.getMaxBudget().intValue();
                    boolean aboveBudget = false;
                    for(PropertyDTO property : found){
                        if(property.getPrice() != null && property.getPrice() > budget){
                            aboveBudget = true;
                            break;
                        }
                    }
                    usedData += "ميزانية المستخدم: " + budget + " ريال\n";
                    String note;
                    if(aboveBudget){
                        note = "Some listings are above the user's budget (" + budget + "). End the reply by asking: تبي أعرض لك اللي ضمن ميزانيتك بس؟";
                    }else{
                        note = "All listings are within the user's budget (" + budget + "). Do not ask about the budget.";
                    }
                    return Map.of("note", note, "listings", found);
                }
            }
            return found;
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }




    @Tool(description = "Listings in one side of a city: north, south, east or west. Use it when the user says شمال الرياض, جنوب, شرق, غرب or north of the city. City, listing type and property type are optional, the user's preference is used if they are empty")
    public Object areaListings(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                               @ToolParam(description = "rent or sale", required = false) String listingType,
                               @ToolParam(description = "apartment, villa, floor, duplex, building or all", required = false) String propertyType,
                               @ToolParam(description = "north, south, east or west") String area,
                               @ToolParam(description = "maximum yearly price in SAR. Leave it EMPTY to use the user's saved budget", required = false) Integer maxPrice){
        try{
            city = orPreference(city, "city");
            listingType = orPreference(listingType, "listingType");
            propertyType = orPreference(propertyType, "propertyType");
            //no price from the user: use the budget from the housing preference
            if(maxPrice == null){
                HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
                if(preference != null && preference.getMaxBudget() != null){
                    maxPrice = preference.getMaxBudget().intValue();
                    usedData += "ميزانية المستخدم: " + maxPrice + " ريال\n";
                }
            }
            System.out.println("areaListings called: city=" + city + ", area=" + area + ", max=" + maxPrice);
            List<PropertyDTO> found = remember(propertyService.getInArea(city, listingType, propertyType, area, maxPrice));
            if(found.isEmpty()){
                return track("لا توجد إعلانات في " + area + " " + city + " ضمن هذا السعر حالياً.");
            }
            return found;
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }



    @Tool(description = "Distance in km between one card from the previous answer and one of the user's important places (like work). ALWAYS use this for any distance question, never calculate or guess a distance yourself")
    public String distanceToMyPlace(@ToolParam(description = "card number from the previous answer, 1 for the first") Integer number,
                                    @ToolParam(description = "place name or type, like work or دوام. Empty if the user has one place", required = false) String place){
        try{
            if(number == null || number < 1 || number > previousCards.size()){
                return track("لا يوجد عقار رقم " + number + " في الرد السابق.");
            }
            PropertyDTO card = previousCards.get(number - 1);
            if(card.getLatitude() == null || card.getLongitude() == null){
                return track("موقع هذا العقار غير موجود في الإعلان، فما نقدر نحسب المسافة.");
            }

            List<PlacePreference> places = placePreferenceRepository.findPlacePreferencesByUser_Id(userId);
            if(places.isEmpty()){
                return track("المستخدم ما أضاف أماكن مهمة. قل له يضيف مكان دوامه أول.");
            }
            //find the place by name or type, or take the only place
            PlacePreference chosen = null;
            if(places.size() == 1){
                chosen = places.get(0);
            }
            for(PlacePreference p : places){
                if(place != null && !place.isBlank()
                        && ((p.getName() != null && p.getName().toLowerCase().contains(place.toLowerCase()))
                        || (p.getType() != null && p.getType().toLowerCase().contains(place.toLowerCase())))){
                    chosen = p;
                    break;
                }
            }
            if(chosen == null){
                String names = "";
                for(PlacePreference p : places){
                    names += p.getName() + " (" + p.getType() + ")، ";
                }
                return track("ما عرفت أي مكان يقصد. أماكنه: " + names + "اسأله أي واحد.");
            }

            double distance = propertyService.calculateDistanceKm(chosen.getLatitude(), chosen.getLongitude(), card.getLatitude(), card.getLongitude());
            distance = Math.round(distance * 10) / 10.0;
            return track("المسافة بين عقار " + number + " في حي " + card.getNeighborhood() + " و " + chosen.getName() + ": " + distance + " كم (خط مستقيم)");
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }



    @Tool(description = "Compare several districts, or list listings in one or more districts. Districts are Arabic names separated by comma, like النرجس,الملقا. City, listing type and property type are optional, the user's preference is used if they are empty")
    public String compareDistricts(@ToolParam(description = "city in English lowercase, like riyadh or jeddah", required = false) String city,
                                   @ToolParam(description = "rent or sale", required = false) String listingType,
                                   @ToolParam(description = "apartment, villa, floor, duplex, building or all", required = false) String propertyType,
                                   @ToolParam(description = "district names separated by comma") String districts){
        try{
            city = orPreference(city, "city");
            listingType = orPreference(listingType, "listingType");
            propertyType = orPreference(propertyType, "propertyType");

            districts = districts.replace("،", ",");


            List<PropertyDTO> cards = remember(propertyService.getByDistricts(city, listingType, propertyType, districts));

            //best district by average price and by average area (calculated in Java)
            String cheapestName = null;
            long cheapestAvg = 0;
            String largestName = null;
            long largestArea = 0;

            //summary for each district, calculated in Java
            String result = "ملخص محسوب من آخر الإعلانات المعروضة (عينة وليس كل السوق):\n";
            for(String district : districts.split(",")){
                String name = district.trim();
                //skip empty names like "النرجس,"
                if(name.isEmpty()){
                    continue;
                }
                int count = 0;
                int minPrice = 0;
                long totalPrice = 0;
                double totalArea = 0;
                int areaCount = 0;

                for(PropertyDTO property : propertyService.getByDistricts(city, listingType, propertyType, name)){
                    if(property.getPrice() == null){
                        continue;
                    }
                    count++;
                    totalPrice += property.getPrice();
                    if(minPrice == 0 || property.getPrice() < minPrice){
                        minPrice = property.getPrice();
                    }
                    if(property.getAreaSqm() != null){
                        totalArea += property.getAreaSqm();
                        areaCount++;
                    }
                }

                if(count == 0){
                    result += name + ": لا توجد إعلانات حالياً\n";
                    continue;
                }

                long avgPrice = totalPrice / count;
                result += name + ": عدد الإعلانات في العينة " + count
                        + "، أقل سعر " + minPrice + " ريال"
                        + "، متوسط السعر " + avgPrice + " ريال";
                if(cheapestName == null || avgPrice < cheapestAvg){
                    cheapestName = name;
                    cheapestAvg = avgPrice;
                }

                if(areaCount > 0){
                    long avgArea = Math.round(totalArea / areaCount);
                    result += "، متوسط المساحة " + avgArea + " متر مربع";
                    if(largestName == null || avgArea > largestArea){
                        largestName = name;
                        largestArea = avgArea;
                    }
                }
                result += "\n";
            }

            if(cheapestName != null){
                result += "الخلاصة: الأرخص بالمتوسط هو " + cheapestName + "\n";
            }
            if(largestName != null){
                result += "الخلاصة: الأوسع بالمتوسط هو " + largestName + "\n";
            }

            //the cards the user will see, in order
            result += "العقارات المعروضة للمستخدم بالترتيب:\n";
            for(PropertyDTO card : cards){
                result += card.getNeighborhood() + "، " + card.getPrice() + " ريال، غرف " + card.getBedrooms() + "، مساحة " + card.getAreaSqm() + "\n";
            }
            return track(result);
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }

    @Tool(description = "Get one listing from the cards shown in the previous answer by its number (1 = first card). Use it when the user says the first, second or third listing. The result has the externalId for similar")
    public Object previousListing(@ToolParam(description = "card number, 1 for the first card") Integer number){
        try{
            if(number == null || number < 1 || number > previousCards.size()){
                return track("لا يوجد عقار رقم " + number + " في الرد السابق. عدد العقارات المعروضة كان " + previousCards.size());
            }
            List<PropertyDTO> one = new ArrayList<>();
            one.add(previousCards.get(number - 1));
            remember(one);
            return one.get(0);
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }
    @Tool(description = "Similar listings to one card from the previous answer. Use it when the user says 'something similar' or 'يشبهه'. If the previous answer had only one listing, leave number empty")
    public Object similarToPrevious(@ToolParam(description = "card number from the previous answer, 1 for the first. Empty if the previous answer had one listing", required = false) Integer number){
        try{
            System.out.println("similarToPrevious called: number=" + number + ", previous cards=" + previousCards.size());
            if(previousCards.isEmpty()){
                return track("ما فيه عقارات في الرد السابق. قل للمستخدم يبحث عن عقارات أول.");
            }
            //only one listing saved: that is the one the user means
            if(previousCards.size() == 1){
                number = 1;
            }
            if(number == null){
                return track("الرد السابق فيه " + previousCards.size() + " عقارات. اسأل المستخدم أي واحد يقصد بالرقم.");
            }
            if(number < 1 || number > previousCards.size()){
                return track("لا يوجد عقار رقم " + number + " في الرد السابق. عدد العقارات المعروضة كان " + previousCards.size());
            }
            String externalId = previousCards.get(number - 1).getExternalId();
            List<PropertyDTO> found = remember(propertyService.getSimilar("KITE", externalId));
            if(found.isEmpty()){
                return track("لا توجد عقارات مشابهة لهذا العقار حالياً.");
            }
            return found;
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }

    @Tool(description = "Full details of one listing by its externalId")
    public Object propertyDetails(@ToolParam(description = "the listing externalId") String externalId){
        try{
            List<PropertyDTO> one = new ArrayList<>();
            one.add(propertyService.getPropertyById("KITE", externalId));
            remember(one);
            return one.get(0);
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }

    @Tool(description = "Similar listings to one listing: same type, price within 20%, rooms ±1, within 5 km")
    public Object similar(@ToolParam(description = "the listing externalId") String externalId){
        try{
            return remember(propertyService.getSimilar("KITE", externalId));
        }catch (ApiException e){
            return "Error: " + e.getMessage();
        }catch (Exception e){
            return UNEXPECTED_ERROR;
        }
    }


    /////Helper methods/////

    //save the listings for the frontend (max 10 cards) and give them to the AI as clear Arabic lines
    private List<PropertyDTO> remember(List<PropertyDTO> properties){
        lastProperties = new ArrayList<>();
        usedData += "عدد النتائج: " + properties.size() + "\n";
        for(int i = 0; i < properties.size() && i < 10; i++){
            PropertyDTO p = properties.get(i);
            lastProperties.add(p);
            String line = "عقار " + (i + 1) + ": حي " + p.getNeighborhood()
                    + "، السعر " + p.getPrice() + " ريال"
                    + "، عدد الغرف " + (p.getBedrooms() == null ? "غير مذكور" : p.getBedrooms())
                    + "، المساحة " + (p.getAreaSqm() == null ? "غير مذكورة" : Math.round(p.getAreaSqm()) + " متر مربع");
            if(p.getDistanceKm() != null){
                line += "، المسافة " + p.getDistanceKm() + " كم";
            }
            //bathrooms and the owner's description are real data too
            if(p.getBathrooms() != null){
                line += "، دورات المياه " + p.getBathrooms();
            }
            if(p.getDescription() != null && !p.getDescription().isBlank()){
                line += "\nوصف عقار " + (i + 1) + ": " + p.getDescription();
            }
            usedData += line + "\n";
        }
        return lastProperties;
    }

    //save a text result so we can check the AI numbers later
    private String track(String result){
        usedData += result + "\n";
        return result;
    }

    //empty value from the AI: use the city from the message, or the user's saved preference
    private String orPreference(String value, String field){
        if(value != null && !value.isBlank()){
            return value;
        }
        //the AI left the city empty, but the user wrote a city in the message
        if(field.equals("city") && cityFromMessage != null){
            return cityFromMessage;
        }
        HousingPreference p = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
        if(p == null){
            throw new ApiException("Please add your housing preference first");
        }
        if(field.equals("city")){
            return p.getCity();
        }
        if(field.equals("listingType")){
            return p.getListingType();
        }
        return p.getPropertyType();
    }
}