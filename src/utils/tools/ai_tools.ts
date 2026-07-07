// utils/tools/ai_tools.ts
export const getUserTools = [
  {
    type: "function",
    function: {
      name: "get_users",
      description: "Get a list of all users from the database",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  }
];