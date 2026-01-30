# Yandex AI Provider for Vercel's AI SDK

## Table of Contents

- [YandexChatModel](#yandexchatmodel)  
    - [Basic Example](#basic-example)  
    - [Agent](#agent)  

## YandexChatModel

### Basic Example

```typescript
import { YandexChatModel } from "./chat";

const chatModel = new YandexChatModel("yandexgpt-lite", {
  folderId,
  secretKey,
});

const { text } = await generateText({
  model: chatModel,
  prompt: "Hello!",
});

console.log(text);
```

### Agent

```typescript
import { YandexChatModel } from "./chat";
import { ToolLoopAgent, tool } from "ai";
import type { SharedV3ProviderOptions } from "@ai-sdk/provider";
import { z } from "zod";

const chatModel = new YandexChatModel("yandexgpt-lite", {
  folderId,
  secretKey,
});

const getUserTool = tool({
  description: "Retrieves information about a user",
  inputSchema: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }) => {
    return {
      id: userId,
      name: "Ivan",
      age: 30,
    };
  },
});

const agent = new ToolLoopAgent({
  model: chatModel,
  tools: {
    getUser: getUserTool,
  },
  instructions: "Respond to users in a friendly manner",
  providerOptions: {
    parallelToolCalls: true,
  } satisfies YandexChatProviderOptions as unknown as SharedV3ProviderOptions,
});

const { text } = await agent.generateText({
  prompt: "Hi! Get me information about the user with id 12345",
});

console.log(text);
```
