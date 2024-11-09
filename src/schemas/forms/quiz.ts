import { Difficulty } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const MAX_FILE_SIZE = 500000;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/wps-office.docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const quizCreationSchema = zfd
  .formData({
    topic: z
      .string()
      .max(250, { message: "Topic must be at most 250 characters long" })
      .optional(), // Make topic optional for now

    amount: zfd.numeric().refine((val) => val >= 5 && val <= 15, {
      message: "Amount must be between 5 and 15 questions",
    }),

    language: z.enum(["auto", "english", "french", "arabic"], {
      required_error: "Language selection is required",
    }),

    difficulty: z.nativeEnum(Difficulty, {
      required_error: "Question level is required",
    }),

    topicDoc: z
      .any()
      .refine(
        (file) => (file ? file.size <= MAX_FILE_SIZE : true),
        `Max file size is 5MB.`,
      )
      .refine(
        (file) =>
          file ? !file || ALLOWED_DOC_TYPES.includes(file.type) : true,
        {
          message: "Only PDF, DOC, or DOCX files are accepted for documents.",
        },
      ), // Optional for the custom validation
    topicImage: z
      .any()
      .refine(
        (file) => (file ? file.size <= MAX_FILE_SIZE : true),
        `Max file size is 5MB.`,
      )
      .refine(
        (file) =>
          file ? !file || ALLOWED_IMAGE_TYPES.includes(file.type) : true,
        {
          message: "Only PNG and JPEG images are accepted for images.",
        },
      ),
  })
  .refine((data) => data.topic || data.topicDoc || data.topicImage, {
    message: "Either topic or upload a image/doc file to extract text from",
    path: ["topic"], // Adjust to show the error on the topic field
  })
  .refine((data) => data.topic || data.topicDoc || data.topicImage, {
    message: "Either topic or upload a image/doc file to extract text from",
    path: ["topicImage"], // Adjust to show the error on the topic field
  })
  .refine((data) => data.topic || data.topicDoc || data.topicImage, {
    message: "Either topic or upload a image/doc file to extract text from",
    path: ["topicDoc"], // Adjust to show the error on the topic field
  });
