import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BusinessState, InsightType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-flash-preview";

// Define schema for Business Intelligence Response
const businessStateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ['IDLE', 'ANALYZING', 'VISUALIZING'],
      description: "Current processing state of the BI engine."
    },
    insightType: {
      type: Type.STRING,
      enum: [InsightType.FINANCIAL, InsightType.INVENTORY, InsightType.ALERT, InsightType.GENERAL],
      description: "The category of the business insight detected."
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "AI confidence level in the analysis (0-100)."
    },
    recordsLoaded: {
      type: Type.INTEGER,
      description: "Number of records currently being considered in context."
    },
    message: {
      type: Type.STRING,
      description: "The natural language response (Hindi or English) explaining the insight."
    },
    chartData: {
      type: Type.OBJECT,
      description: "Optional. Only populate if user asks to 'visualize', 'graph', or 'chart' something.",
      properties: {
        type: {
            type: Type.STRING,
            enum: ['bar', 'pie', 'line'],
            description: "The type of chart best suited for the data."
        },
        title: {
            type: Type.STRING,
            description: "Short title for the chart."
        },
        data: {
            type: Type.ARRAY,
            description: "Array of data points to plot.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Label for the data point (e.g. Month, Product)" },
                    value: { type: Type.NUMBER, description: "Numerical value" }
                },
                required: ["name", "value"]
            }
        }
      },
      required: ["type", "title", "data"]
    },
    tableData: {
      type: Type.OBJECT,
      description: "Optional. Only populate if user asks for 'table', 'list', 'raw data', or 'show me data'.",
      properties: {
        title: {
            type: Type.STRING,
            description: "Title of the data table."
        },
        columns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of column headers."
        },
        rows: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    data: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Ordered list of values corresponding to columns."
                    }
                },
                required: ["data"]
            },
            description: "The data rows, each containing a list of values."
        }
      },
      required: ["title", "columns", "rows"]
    }
  },
  required: ["status", "insightType", "confidenceScore", "message"]
};

export const processCommand = async (
  command: string, 
  currentState: BusinessState, 
  dataContext: Record<string, string>
): Promise<BusinessState> => {
  try {
    // Construct context from multiple files
    let dataSnippet = "";
    const fileNames = Object.keys(dataContext);
    
    if (fileNames.length === 0) {
        dataSnippet = "No files uploaded.";
    } else {
        fileNames.forEach(name => {
            dataSnippet += `\n--- SOURCE FILE: ${name} (First 50 rows) ---\n${dataContext[name]}\n`;
        });
    }

    const prompt = `
      You are "Vernacular Ops", an advanced Business Intelligence AI.
      
      ROLE:
      - You act as a bridge between a business owner and their data.
      - You are bilingual: Speak fluent English and Hinglish (Hindi + English mix).
      - You translate human questions into data insights, visual charts, and data tables.
      - You can compare data across multiple files if provided.

      CONTEXT:
      - Current Records Loaded (Total): ${currentState.recordsLoaded}
      - Loaded Data Sources:
      """
      ${dataSnippet}
      """

      USER QUERY: "${command}"

      INSTRUCTIONS:
      1. Analyze the Data Sources to answer the query. If comparing files, reference them by name.
      2. VISUALS: If user asks to "visualize", "show graph", "chart", or "plot", generate 'chartData'.
      3. TABLES: If user asks to "show data", "table", "list", "rows", or "details", generate 'tableData'.
         - Populate 'columns' with relevant headers.
         - Populate 'rows' as objects containing a 'data' array with values matching the column order.
      4. Categorize the query into FINANCIAL, INVENTORY, ALERT, or GENERAL.
      5. Tone: Professional Business Analyst.
      
      Output JSON only matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: businessStateSchema,
        systemInstruction: "You are a bilingual Business Analytics AI. Output structured JSON."
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as BusinessState;
      // Preserve local record count logic managed by frontend
      if (fileNames.length === 0) {
        result.recordsLoaded = 0;
      } else if (result.recordsLoaded === 0 && currentState.recordsLoaded > 0) {
        result.recordsLoaded = currentState.recordsLoaded;
      }
      return result;
    }
    
    throw new Error("No response from AI Analyst");
  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      ...currentState,
      status: 'IDLE',
      insightType: InsightType.ALERT,
      message: "System Error: Unable to process business logic at this time."
    };
  }
};