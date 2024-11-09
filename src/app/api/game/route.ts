import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { createWorker } from "tesseract.js";
import { parseOfficeAsync } from "officeparser";

export async function POST(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const body = await req.formData();

    let { topic, topicDoc, topicImage, amount, difficulty, language } =
      quizCreationSchema.parse(body);

    if (topicDoc) {
      const docBuffer = Buffer.from(await topicDoc.arrayBuffer());
      topic = await parseOfficeAsync(docBuffer);
    }

    if (topicImage) {
      const imageBuffer = Buffer.from(await topicImage.arrayBuffer());
      const worker = await createWorker(undefined, undefined, {
        workerPath:
          "./node_modules/tesseract.js/src/worker-script/node/index.js",
      });

      await worker.load();

      const {
        data: { text: extractedText },
      } = await worker.recognize(imageBuffer);

      topic = extractedText;

      await worker.terminate();
    }

    topic = (topic as string)
      .replace(/[\r\n]+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove unnecessary symbols
      .trim() // Trim leading and trailing whitespace
      .slice(0, 250); // Limit to 250 characters

    const { data } = await axios.post(
      `${process.env.API_URL as string}/api/questions`,
      {
        amount,
        topic,
        difficulty,
        language,
      },
    );

    const { questions, topicSumary } = data;

    //const { topic, topicImage, topicDoc, amount, difficulty, language } =
    //  quizCreationSchema.parse(body);

    const game = await prisma.game.create({
      data: {
        timeStarted: new Date(),
        userId: session.user.id,
        topic: topicSumary,
        difficulty,
      },
    });

    await prisma.topic_count.upsert({
      where: {
        topic: topicSumary,
      },
      create: {
        topic: topicSumary,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    type Question = {
      question: string;
      answer: string;
      option1: string;
      option2: string;
      option3: string;
    };

    const manyData = questions.map((question: Question) => {
      // mix up the options lol
      const options = [
        question.option1,
        question.option2,
        question.option3,
        question.answer,
      ].sort(() => Math.random() - 0.5);
      return {
        question: question.question,
        answer: question.answer,
        options: JSON.stringify(options),
        gameId: game.id,
      };
    });

    await prisma.question.createMany({
      data: manyData,
    });

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        },
      );
    } else {
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? error
              : "An unexpected error occurred on game.",
        },
        {
          status: 500,
        },
      );
    }
  }
}
export async function GET(req: Request, res: Response) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        },
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        questions: true,
      },
    });
    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 400,
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      },
    );
  }
}
