import { inngest } from "@/inngest/client";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { candidateId } = body;

    if (!adminSupabase) {
      console.error(
        "Supabase admin client (adminSupabase) is null. serviceRoleKey might be missing."
      );
      throw new Error("Supabase admin client is not configured");
    }

    const { data: feedbackData } = await adminSupabase
      .from("interview_results")
      .select(
        `
            id,
            report,
            created_at,
            interviews (
              id,
              title,
              interview_type
            ),
            transcript
          `
      )
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    console.log("feedbackData=", feedbackData);

    const { data: resumeData } = await adminSupabase
      .from("candidates")
      .select("resume_analysis")
      .eq("id", candidateId);

    console.log("resumeData=", resumeData);

    const response = await inngest.send({
      name: "userDetails/analysis.function",
      data: { resumeData, feedbackData, candidateId },
    });

    const runId = response.ids[0];

    let runStatus;

    while (true) {
      runStatus = await getRunStatus(runId);

      const status = runStatus[0]?.status;
      if (status === "Completed") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return Response.json(runStatus[0]?.output?.output[0]);
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function getRunStatus(runId: string) {
  const url = `${process.env.INNGEST_SERVER_HOST}/v1/events/${runId}/runs`;

  const response = await fetch(
    `${process.env.INNGEST_SERVER_HOST}/v1/events/${runId}/runs`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
      },
    }
  );

  const json = await response.json();
  return json.data;
}
