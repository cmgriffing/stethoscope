import { StaticImage } from "gatsby-plugin-image"
import * as React from "react"
import { Downloads } from "./downloads"

export function Hero() {
  return (
    <section className="text-gray-600 body-font">
      <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
        <div className="lg:max-w-lg lg:w-1/3 md:w-1/3 w-1/6 mb-10 md:mb-0">
          <StaticImage
            className="object-cover object-center rounded"
            alt="hero"
            src="../images/openmoji_stethoscope.png"
            placeholder="tracedSVG"
          />
        </div>
        <div className="lg:flex-grow md:w-2/3 lg:pl-24 md:pl-16 flex flex-col md:items-start md:text-left items-center text-center">
          <h1 className="title-font sm:text-4xl text-5xl mb-4 font-medium text-gray-900">
            Stethoscope
          </h1>
          <p className="mb-8 leading-relaxed">
            We all have criteria by which we judge a Github repo. This extension
            bundles that up into a quick and easy pulse check. Get it for your
            favorite browser now!
          </p>
          <Downloads />
        </div>
      </div>
    </section>
  )
}
