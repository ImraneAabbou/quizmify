import DetailsDialog from "@/components/DetailsDialog";
import HistoryCard from "@/components/dashboard/HistoryCard";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
  title: "Dashboard | Quizzzy",
  description: "Quiz yourself on anything!",
};

const Dasboard = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="p-8 mx-auto max-w-7xl">
      <div className="flex items-center">
        <h2 className="mr-2 text-3xl font-bold tracking-tight">Dashboard</h2>
        <DetailsDialog />
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <QuizMeCard />
          <HistoryCard />
        </div>
        <div>
          <RecentActivityCard />
        </div>
      </div>
    </main>
  );
};

export default Dasboard;
