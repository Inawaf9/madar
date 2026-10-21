package com.example.madar.Client;

import com.example.madar.Api.ApiException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Component;

@Component
public class AiTestClient {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;

    public AiTestClient(ChatClient.Builder builder, ChatMemory chatMemory) {
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
}