# Project

In order to make your repository compatible with inlang apps, you will need to create an inlang project, which is defined by a directory that emulates a file `{name}.inlang`. Just like a `.pptx` file, that under the hood is a directory, that contains project files.

![inlang project](https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/documentation/ecosystem/assets/project-2.jpg)

### \*.inlang directory

This project essentially consists of a folder (`[project_name].inlang`) that includes a `settings.json` file and a `project_id` file. The `settings.json` file defines the settings for a project and is the entrypoint for all inlang apps, plugins, and tools in the inlang ecosystem.

The `project_id` is used for anonymous telemetry. We have insights for the monthly active projects, the size of projects, and what plugins are used [July 23, 2023]. We plan to offer opt-out telemtry in the future, and making the telemetry public to align the community with technical decisions we make (based on the telemetry data we have).

![Project directory](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/project_new4.png)

### Monorepo support

You can have multiple inlang projects in your repository. This is useful in a monorepo setup. If you need a guide to get started, visit the individual pages of the inlang [apps](/c/apps).
