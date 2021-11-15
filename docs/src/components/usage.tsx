import { StaticImage } from "gatsby-plugin-image"
import * as React from "react"

export function Usage() {
  return (
    <section className="text-gray-600 body-font">
      <StaticImage
        src="../images/screenshot-other.png"
        alt="Screenshot of Stethoscope in action on the expressjs repo page"
      />

      <div className="container px-5 pt-24 pb-6 mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <h2 className="text-xs text-indigo-500 tracking-widest font-medium title-font mb-1">
            It's quick and easy
          </h2>
          <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
            Usage
          </h1>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base text-left">
            Getting started is as easy as:
          </p>
          <ol className="text-left md:w-2/3 mx-auto list-decimal">
            <li>Installing the plugin for your browser</li>
            <li>Going to a Github repo's root page</li>
            <li>
              Checking out Stethoscope's output in the popup action or in your
              toolbar
            </li>
            <li>
              Configure which criteria you care about in the popup (optional)
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
