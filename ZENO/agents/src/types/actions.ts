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

export type SystemControlAction = {
  type: "system_control";
  action: "sleep" | "lock" | "shutdown" | "restart";
};

export type ListBluetoothAction = {
  type: "list_bluetooth";
};

export type BluetoothConnectAction = {
  type: "bluetooth_connect";
  device_name: string;
  connect: boolean;
};

export type SendWhatsAppMessageAction = {
  type: "send_whatsapp_message";
  contact_name: string;
  message: string;
  confirm: boolean;
};

export type Action =
  | AssistantMessageAction
  | OpenAppAction
  | OpenWithQueryAction
  | SearchWebAction
  | SystemControlAction
  | ListBluetoothAction
  | BluetoothConnectAction
  | SendWhatsAppMessageAction;

