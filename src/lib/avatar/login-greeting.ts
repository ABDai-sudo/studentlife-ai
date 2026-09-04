export type LoginSpeechPhase = "idle" | "success";

export type LoginGreetingInput = {
  phase?: LoginSpeechPhase;
  broMode: boolean;
  examWeek: boolean;
};

export type LoginGreetingKey =
  | "login.speech.default"
  | "login.speech.bro"
  | "login.speech.exam"
  | "login.speech.success";

/**
 * Login-only avatar speech. Exam copy is used only when a real hint exists.
 * Bro copy follows the saved personality, never a guessed gender.
 */
export function getLoginGreetingKey(input: LoginGreetingInput): LoginGreetingKey {
  if (input.phase === "success") return "login.speech.success";
  if (input.examWeek) return "login.speech.exam";
  if (input.broMode) return "login.speech.bro";
  return "login.speech.default";
}
