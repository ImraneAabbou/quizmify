"use client";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Tabs from "@radix-ui/react-tabs"
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { FaEllipsisVertical } from "react-icons/fa6";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoadingQuestions from "../LoadingQuestions";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";

type Props = {
  topic: string;
};

type Languages = "auto" | "english" | "arabic" | "french"

type Input = z.infer<typeof quizCreationSchema>;

const QuizCreation = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = React.useState(false);
  const [finishedLoading, setFinishedLoading] = React.useState(false);
  const { toast } = useToast();
  const { mutate: getQuestions, isLoading } = useMutation({
    mutationFn: async ({ amount, topic, topicDoc, topicImage, language, difficulty }: Input) => {

      const formData = new FormData();
      formData.append("amount", amount.toString());
      formData.append("topic", topic ?? "");
      formData.append("topicDoc", topicDoc ?? "");
      formData.append("topicImage", topicImage ?? "");
      formData.append("difficulty", difficulty);
      formData.append("language", language);
      const response = await axios.post("/api/game", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam,
      topicDoc: undefined,
      topicImage: undefined,
      amount: 5,
      language: "auto",
      difficulty: Difficulty.EASY,
    },
  });

  const onSubmit = async (data: Input) => {
    setShowLoader(true);
    getQuestions(data, {
      onError: (error) => {
        setShowLoader(false);
        if (error instanceof AxiosError) {
          if (error.response?.status === 500) {
            toast({
              title: "Error",
              description: "Something went wrong. Please try again later.",
              variant: "destructive",
            });
          }
        }
      },
      onSuccess: ({ gameId }: { gameId: string }) => {
        setFinishedLoading(true);
        setTimeout(() => {
          router.push(`/play/${gameId}`);
        }, 2000);
      },
    });
  };
  form.watch();

  if (showLoader) {
    return <LoadingQuestions finished={finishedLoading} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs.Root
          className="container max-w-4xl"
          defaultValue="text-tab"
        >
          <Card>
            <div className="flex justify-between border-b border-mauve6">
              <Tabs.List
                className="flex shrink-0"
                aria-label="Manage your account"
              >
                <Tabs.Trigger
                  className="flex h-[45px] flex-1 select-none items-center justify-center px-5 text-[15px] leading-none text-mauve11 outline-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current"
                  value="text-tab"
                >
                  Text
                </Tabs.Trigger>
                <Tabs.Trigger
                  className="flex h-[45px] flex-1 select-none items-center justify-center px-5 text-[15px] leading-none text-mauve11 outline-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current"
                  value="image-tab"
                >
                  Image
                </Tabs.Trigger>
                <Tabs.Trigger
                  className="flex h-[45px] flex-1 select-none items-center justify-center px-5 text-[15px] leading-none text-mauve11 outline-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current"
                  value="doc-tab"
                >
                  Document
                </Tabs.Trigger>
              </Tabs.List>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="mx-4 my-2">
                    <FaEllipsisVertical />
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-gray/50 backdrop-blur data-[state=open]:animate-overlayShow" />
                  <Dialog.Content className="fixed bg-[hsl(var(--background))] left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow">
                    <Dialog.Title className="m-0 text-[17px] font-medium text-mauve12">
                      Quiz Options
                    </Dialog.Title>
                    <Dialog.Description className="mb-5 mt-2.5 leading-normal text-[0.8rem] text-muted-foreground">
                      Adjust the generated quiz to what level, language and amount of question you want !
                    </Dialog.Description>


                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Questions</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="How many questions?"
                              type="number"
                              {...field}
                              onChange={(e) => {
                                form.setValue("amount", parseInt(e.target.value));
                              }}
                              min={5}
                              max={15}
                            />
                          </FormControl>
                          <FormDescription>
                            You can choose how many questions you would like to be
                            quizzed on here.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              onChange={(e) => {
                                form.setValue("language", e.target.value as Languages);
                              }}
                              className={cn(
                                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50")}
                            >
                              <option value="auto">Auto</option>
                              <option value="english">English</option>
                              <option value="french">French</option>
                              <option value="arabic">Arabic</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            What language should be used in the generated quizz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              onChange={(e) => {
                                form.setValue("difficulty", e.target.value as Difficulty);
                              }}
                              className={cn(
                                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50")}
                            >
                              <option value="auto">Auto</option>
                              <option value="EASY">Easy</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HARD">Hard</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            What language should be used in the generated quizz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Dialog.Close asChild>
                      <button
                        className="absolute right-8 top-8 inline-flex size-[24px] appearance-none items-center justify-center rounded-full text-violet11 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
                        aria-label="Close"
                      >
                        <Cross2Icon />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            <Tabs.Content
              className="grow rounded-b-md p-5 outline-none"
              value="text-tab"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Generate & play a quiz of your own !</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          placeholder="Enter a topic, with some details for better quiz !"
                          maxLength={250}
                          {...field}
                          className={cn(
                            "resize-none h-32 flex w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50")}
                        />
                      </FormControl>
                      <FormDescription>
                        The topic should&apos;t exceed 250 characters in total.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} type="submit" className="mt-4">
                  Generate & Play
                </Button>
              </CardContent>
            </Tabs.Content>


            <Tabs.Content
              className="grow rounded-b-md p-5 outline-none"
              value="image-tab"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Generate a quiz from image content !</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="topicImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="file" onChange={e => field.onChange((e.target.files?.length ? e.target.files[0] : undefined))} />
                      </FormControl>
                      <FormDescription>
                        Only the first 250 chars will be considered when extracting the text.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} type="submit" className="mt-4">
                  Generate & Play
                </Button>
              </CardContent>
            </Tabs.Content>


            <Tabs.Content
              className="grow rounded-b-md p-5 outline-none"
              value="doc-tab"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Generate a quiz from document content !</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="topicDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="file" onChange={e => field.onChange((e.target.files?.length ? e.target.files[0] : undefined))} />
                      </FormControl>
                      <FormDescription>
                        Only the first 250 chars will be considered when extracting the text.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} type="submit" className="mt-4">
                  Generate & Play
                </Button>
              </CardContent>
            </Tabs.Content>

          </Card>
        </Tabs.Root>
      </form>
    </Form>
  );
};

export default QuizCreation;
