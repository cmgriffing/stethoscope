module.exports = {
  siteMetadata: {
    title: `A Github repo health check extension`,
    description: `We all have criteria by which we judge a Github repo. This extension bundles that up into a quick and easy pulse check. Get it for your favorite browser now!`,
    author: `@cmgriffing`,
    siteUrl: `https://github.io/cmgriffing/stethoscope`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `stethoscope`,
        short_name: `stethoscope`,
        start_url: `/`,
        background_color: `#DDD`,
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        // theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-postcss`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
