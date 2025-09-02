import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM = `
You are an ICP Discovery Assistant running on a public web page.
Ask one question at a time. Be concise. Confirm multi-part answers and move forward.
When all fields are reasonably populated, say "I am ready to finalize."
When the user says "Finalize", return ONLY these sections in this order:

---MARKDOWN---
<concise, client-ready narrative summary>

---JSON---
<valid JSON matching schema>

---CSV_COMPANIES---
company_name,domain,industry,employee_count,revenue_range,geo,notes

---CSV_PEOPLE---
first_name,last_name,title,seniority,department,company_name,company_domain,geo,linkedin_url,email,phone,notes
`;

const icpJsonSchema = {
  name: "ICP",
  schema: {
    type: "object",
    properties: {
      firmographics: {
        type: "object",
        properties: {
          industry: { type: "array", items: { type: "string" } },
          employee_range: { type: "string" },
          revenue_range: { type: "string" },
          geography: { type: "array", items: { type: "string" } },
        },
        required: ["industry"],
      },
      buyer_roles: {
        type: "object",
        properties: {
          problem_owner_titles: { type: "array", items: { type: "string" } },
          economic_buyer_titles: { type: "array", items: { type: "string" } },
          influencer_titles: { type: "array", items: { type: "string" } },
        },
      },
      problems_triggers: {
        type: "object",
        properties: {
          top_pains: { type: "array", items: { type: "string" } },
          triggers: { type: "array", items: { type: "string" } },
        },
      },
      buying_behavior: {
        type: "object",
        properties: {
          budget_range: { type: "string" },
          sales_cycle: { type: "string" },
          decision_criteria: { type: "array", items: { type: "string" } },
        },
      },
      tech_process: {
        type: "object",
        properties: {
          tools: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } },
        },
      },
      fit_nonfit: {
        type: "object",
        properties: {
          ideal_fit: { type: "array", items: { type: "string" } },
          bad_fit: { type: "array", items: { type: "string" } },
        },
      },
      priority_segments: {
        type: "object",
        properties: {
          primary_icp: { type: "string" },
          secondary_icps: { type: "array", items: { type: "string" } },
        },
      },
    },
    required: [
      "firmographics",
      "buyer_roles",
      "problems_triggers",
      "priority_segments",
    ],
  },
  strict: true,
};

function respOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function respErr(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function flattenResponse(resp: any): string {
  try {
    if (!resp?.output) return "";
    return resp.output
      .map((item: any) =>
        item?.content?.map((c: any) => c?.text?.value || "").join("")
      )
      .join("")
      .trim();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { history = [], finalize = false } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return respErr("OPENAI_API_KEY is not set on the server");
    }

    if (!finalize) {
      const chat = await client.chat.completions.create({
        model: "gpt-4o-mini", // choose the model you have access to
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          ...history.map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });
      const text =
        chat.choices?.[0]?.message?.content?.toString().trim() ||
        "I didn't get a response. Please try again.";
      return respOk({ text });
    }

    const resp = await client.responses.create({
      model: "gpt-5", // or another model that supports json_schema
      temperature: 0.2,
      input: [
        { role: "system", content: SYSTEM },
        ...history,
        { role: "user", content: "Finalize" },
      ],
      response_format: { type: "json_schema", json_schema: icpJsonSchema },
    });

    const text =
      resp.output_text ||
      flattenResponse(resp) ||
      "No finalize text returned; please try again.";
    return respOk({ text });
  } catch (e: any) {
    return respErr(e?.message || "Unknown error from API route");
  }
}
