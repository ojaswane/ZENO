import type { AllowedApp } from "./apps";

export type AssistantMessageAction = {
  type: "assistant_message";
  text: string;
};

export type OpenAppAction = {
  type: "open_app";
  app_name: AllowedApp;
};

export type OpenWithQueryAction = {
  type: "open_with_query";
  app_name: "spotify" | "youtube" | "chrome";
  query: string;
};

export type SearchWebAction = {
  type: "search_web";
  query: string;
};

export type Action = AssistantMessageAction | OpenAppAction | OpenWithQueryAction | SearchWebAction;

