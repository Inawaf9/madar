package com.example.madar.Client;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

@Component
public class OpenRouterClient {

    private final ChatClient chatClient;

    public OpenRouterClient(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }
}
