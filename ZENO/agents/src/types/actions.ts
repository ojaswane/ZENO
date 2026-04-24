import type { AllowedApp } from "./apps";

export type AssistantMessageAction = {
  type: "assistant_message";
  text: string;
};

export type OpenAppAction = {
  type: "open_app";
  app_name: AllowedApp;
};

export type SearchWebAction = {
  type: "search_web";
  query: string;
};

export type Action = AssistantMessageAction | OpenAppAction | SearchWebAction;

