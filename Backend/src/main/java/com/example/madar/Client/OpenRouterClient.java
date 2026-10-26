package com.example.madar.Client;

import com.example.madar.Api.ApiException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Component;
import org.springframework.ai.chat.messages.Message;
import java.util.ArrayList;
import java.util.List;



@Component
public class OpenRouterClient {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;

    public OpenRouterClient(ChatClient.Builder builder, ChatMemory chatMemory) {
        this.chatClient = builder.build();
        this.chatMemory = chatMemory;
    }

    //send rules + message to the AI and get the text back
    public String ask(String rules, String message){
        try{
            return chatClient.prompt()
                    .system(rules)
                    .user(message)
                    .options(OpenAiChatOptions.builder().temperature(0.2))
                    .call()
                    .content();
        }catch (Exception e){
            throw new ApiException("AI is unavailable right now");
        }
    }

    //ask the AI and read its answer as a Java object (structured JSON)
    public <T> T askFor(String rules, String message, Class<T> type){
        try{
            return chatClient.prompt()
                    .system(rules)
                    .user(message)
                    .options(OpenAiChatOptions.builder().temperature(0.2))
                    .call()
                    .entity(type);
        }catch (Exception e){
            throw new ApiException("AI is unavailable right now");
        }
    }

    //chat: the AI can call our tools, and remembers the last messages of this conversation
    public String chat(String rules, String message, Object tools, String conversationId){
        try{
            return chatClient.prompt()
                    .system(rules)
                    .user(message)
                    .tools(tools)
                    .options(OpenAiChatOptions.builder().temperature(0.2))
                    .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();
        }catch (Exception e){
            throw new ApiException("AI is unavailable right now");
        }
    }

    //forget the conversation (new chat)
    public void clearChat(String conversationId){
        chatMemory.clear(conversationId);
    }


    //remove the last question and answer from the memory (used when we reject the AI reply)
    public void forgetLastTurn(String conversationId){
        List<Message> messages = new ArrayList<>(chatMemory.get(conversationId));
        int remove = Math.min(2, messages.size());
        for(int i = 0; i < remove; i++){
            messages.remove(messages.size() - 1);
        }
        chatMemory.clear(conversationId);
        if(!messages.isEmpty()){
            chatMemory.add(conversationId, messages);
        }
    }


    //the new question and answer are still saved after the old messages
    public String chatWithoutHistory(String rules, String message, Object tools, String conversationId){
        List<Message> oldMessages = new ArrayList<>(chatMemory.get(conversationId));
        chatMemory.clear(conversationId);
        try{
            return chat(rules, message, tools, conversationId);
        }finally{

            List<Message> newMessages = new ArrayList<>(chatMemory.get(conversationId));
            chatMemory.clear(conversationId);
            oldMessages.addAll(newMessages);
            if(!oldMessages.isEmpty()){
                chatMemory.add(conversationId, oldMessages);
            }
        }
    }



}