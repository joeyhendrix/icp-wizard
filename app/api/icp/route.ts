import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
          geography: { type: "array", items: { type: "string" } }
        },
        required: ["industry"]
      },
      buyer_roles: {
        type: "object",
        properties: {
          problem_owner_titles: { type: "array", items: { type: "string" } },
          economic_buyer_titles: { type: "array", items: { type: "string" } },
          influencer_titles: { type: "array", items: { type: "string" } }
        }
      },
      problems_triggers: {
        type: "object",
        properties: {
          top_pains: { type: "array", items: { type: "string" } },
          triggers: { type: "array", items: { type: "string" } }
        }
      },
      buying_behavior: {
        type: "object",
        properties: {
          budget_range: { type: "string" },
          sales_cycle: { type: "string" },
          decision_criteria: { type: "array", items: { type: "string" } }
        }
      },
      tech_process: {
        type: "object",
        properties: {
          tools: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } }
        }
      },
      fit_nonfit: {
        type: "object",
        properties: {
          ideal_fit: { type: "array", items: { type: "string" } },
          bad_fit: { type: "array", items: { type: "string" } }
        }
      },
      priority_segments: {
        type: "object",
        properties: {
          primary_icp: { type: "string" },
          secondary_icps: { type: "array", items: { type: "string" } }
        }
      }
    },
    required: ["firmographics", "buyer_roles", "problems_triggers", "priority_segments"]
  },
  strict: true
};

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history = [], finalize = false } = body;

    const base: any = {
      model: "gpt-5",
      input: [{ role: "system", content: SYSTEM }, ...history],
      temperature: 0.2
    };

    if (finalize) {
      base.response_format = { type: "json_schema", json_schema: icpJsonSchema };
      base.input.push({ role: "user", content: "Finalize" });
    }

    const resp = await client.responses.create(base);
    const text = resp.output_text || "";
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Error" }), { status: 500 });
  }
}
