import { useAppStore } from "@/store/useAppStore";
import { messages, type MessageKey } from "@/i18n/messages";

export function useI18n() {
  const language = useAppStore((state) => state.language);

  function t(key: MessageKey) {
    return messages[language][key] ?? messages.uz[key] ?? key;
  }

  return { language, t };
}
