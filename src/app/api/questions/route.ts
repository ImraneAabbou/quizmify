import {
  GPTQuestionsRequest,
  GPTTopicSumaryRequest,
  strict_output,
} from "@/lib/gpt";
import { getAuthSession } from "@/lib/nextauth";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
//export const maxDuration = 500;

export async function POST(req: Request, res: Response) {
  try {
    //const session = await getAuthSession();
    //if (!session?.user) {
    //  console.log("not logged in", session);
    //  return NextResponse.json(
    //    { error: "You must be logged in to create a game." },
    //    {
    //      status: 401,
    //    },
    //  );
    //}

    const body = await req.json();
    const { amount, topic, difficulty, language } =
      getQuestionsSchema.parse(body);

    const questions = await (strict_output(
      `You are a helpful AI that generates MCQ questions. ensure no string exceeds 15 words. Return the result in a valid JSON and use HTML entity instead of quotes or double quotes within the provided strings.`,
      new Array(amount).fill(
        `Generate a random ${difficulty} MCQ question with about "${topic}" where all answers and options are in "${language}" lang and should be no longer than 15 words.`,
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
        option1: "option1 with max length of 15 words",
        option2: "option2 with max length of 15 words",
        option3: "option3 with max length of 15 words",
      },
    ) as GPTQuestionsRequest);

    const { topicSumary } = await (strict_output(
      `You are a helpful AI that sumaries a topic if it contains more than 10 long words to 10 words or less. ensure no string exceeds 10 words. Return the result in a valid JSON and use HTML entity instead of quotes or double quotes.`,
      `sumaries the following ${topic} only if it contains more than 10 words in the "${language}" lang. if less return the original`,
      {
        topicSumary: `topic sumary of "${topic}" should not  be longer than 10 words, return the original if it is not that long yet`,
      },
    ) as GPTTopicSumaryRequest);

    return NextResponse.json(
      {
        topicSumary,
        questions,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        },
      );
    } else {
      console.error("elle gpt error", error);
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? error
              : "An unexpected error occurred on questions.",
        },
        {
          status: 500,
        },
      );
    }
  }
}
