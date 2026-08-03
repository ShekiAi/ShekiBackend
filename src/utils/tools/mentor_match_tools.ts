// utils/tools/mentor_match_tools.ts
export const getMentorMatchTools = [
  {
    type: "function",
    function: {
      name: "search_tutors",
      description:
        "Search GOYE's real tutors by what the student is looking for (a topic, skill, or kind of guidance). Returns real candidates with their bio and the topics of courses they've taught — never invent a tutor that isn't in these results.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the student wants help with, in their own words or a short summary of it" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_match",
      description:
        "Propose connecting the student with a specific tutor from the search_tutors results. This is a terminal action — only call it once you (and ideally the student, if they've reacted to your suggestion) are genuinely comfortable with this match. It notifies the tutor and opens a real chat, so don't call it speculatively.",
      parameters: {
        type: "object",
        properties: {
          tutorId: { type: "string", description: "The id of the chosen tutor, from a prior search_tutors result" },
          reason: {
            type: "string",
            description: "A short, warm explanation of why this tutor is a good fit, written to be shown to both the student and the tutor",
          },
        },
        required: ["tutorId", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "no_suitable_tutor_found",
      description: "Terminal action for when no real tutor is a good fit after a genuine search. Tells the student honestly rather than forcing a bad match.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "A gentle, honest explanation for the student" },
        },
        required: ["reason"],
      },
    },
  },
];
