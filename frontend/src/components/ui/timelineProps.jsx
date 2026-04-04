import React from "react";
import { Timeline } from "@/components/ui/timeline";

export function TimelineDemo() {
  const data = [
    {
      title: "Post Your Project",
      content: (
        <div>
          <p className="mb-8 text-xs font-normal text-neutral-800 md:text-sm dark:text-neutral-200">
            Start your journey by creating a detailed project brief. Describe your requirements, set your budget, and define your timeline. Our platform makes it easy to communicate exactly what you need.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Project Details</h4>
                <p className="text-xs text-gray-600">Define scope, budget & timeline</p>
              </div>
            </div>
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Requirements</h4>
                <p className="text-xs text-gray-600">Specify skills & deliverables</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Review Proposals",
      content: (
        <div>
          <p className="mb-8 text-xs font-normal text-neutral-800 md:text-sm dark:text-neutral-200">
            Receive proposals from qualified freelancers within hours. Review their portfolios, ratings, and previous work. Compare pricing and timelines to find the perfect match for your project.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Freelancer Profiles</h4>
                <p className="text-xs text-gray-600">View portfolios & ratings</p>
              </div>
            </div>
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Proposals</h4>
                <p className="text-xs text-gray-600">Compare bids & timelines</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Collaborate & Deliver",
      content: (
        <div>
          <p className="mb-4 text-xs font-normal text-neutral-800 md:text-sm dark:text-neutral-200">
            Work seamlessly with your chosen freelancer through our platform. Track progress, share files, and communicate in real-time. Release payment securely once you're satisfied with the delivered work.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Real-time Chat</h4>
                <p className="text-xs text-gray-600">Seamless communication</p>
              </div>
            </div>
            <div className="h-32 w-full rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 shadow-sm md:h-44 lg:h-60 flex items-center justify-center">
              <div className="text-center p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Secure Payment</h4>
                <p className="text-xs text-gray-600">Protected transactions</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="relative w-full overflow-clip">
      <Timeline data={data} />
    </div>
  );
}
