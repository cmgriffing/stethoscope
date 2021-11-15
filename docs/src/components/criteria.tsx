import * as React from "react"
import { Downloads } from "./downloads"

const criteriaList = [
  {
    description:
      "Has License file or section in the README. It is an immediate fail if no license is found.",
  },

  {
    description:
      "Most recent commit. Scaled to within a year. 1 year ago being a 0 and now being a 20.",
  },
  { description: "Stars count being above 100." },
  { description: "Has Readme file." },
  { description: "Amount of contributors being greater than 5." },
  { description: "Total amount of commits." },
  { description: "Has a sponsors section." },
  { description: "Has a releases section." },
  {
    description: "Frequency of commits for root level files and folders.",
  },
  {
    description: "Open issues relative to star count or commit count.",
  },

  { description: "Has docs folder." },
]

export function Criteria() {
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 pt-2 pb-24 mx-auto">
        <div className="text-center mb-20">
          <h1 className="sm:text-3xl text-2xl font-medium text-center title-font text-gray-900 mb-4">
            Criteria
          </h1>
          <p className="text-base leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto">
            The criteria below are how we determine a repo's score. You can
            toggle them off as you see fit. Eventually, you will be able to
            assign individual weight values as well.
          </p>
        </div>
        <div className="flex flex-wrap lg:w-4/5 sm:mx-auto sm:mb-2 -mx-2">
          {criteriaList.map(criterion => (
            <div className="p-2 sm:w-1/2 w-full">
              <div className="bg-gray-100 rounded flex p-4 h-full items-center">
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  className="text-indigo-500 w-6 h-6 flex-shrink-0 mr-4"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                  <path d="M22 4L12 14.01l-3-3"></path>
                </svg>
                <span className="title-font font-medium">
                  {criterion.description}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-8 text-center">
          <h3 className="sm:text-3xl text-2xl font-medium text-center title-font text-gray-900 mb-4 py-4">
            Get it now!
          </h3>
          <Downloads />
        </div>
      </div>
    </section>
  )
}
