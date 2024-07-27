/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import axios from "axios";
const dotenv = require("dotenv");
dotenv.config();

export default (app) => {
  app.on("pull_request.opened", async (context) => {
    axios.get(process.env.URL + "/build").then((res) => {
      if (res.data.status === "ok") {
        return context.octokit.pulls.createReview({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.number,
          body: "Hooray, the build passed!",
          event: "APPROVE",
        });
      } else {
        return context.octokit.pulls.createReview({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.number,
          body: "Sorry, the build failed!",
          event: "REQUEST_CHANGES",
        });
      }
    });
  });

  app.on("push", async (context) => {
    axios.get(process.env.URL + "/build").then((res) => {
      if (res.data.status === "ok") {
        return context.octokit.checks.create({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          name: "Build",
          head_sha: context.payload.head_commit.id,
          status: "completed",
          conclusion: "success",
        });
      } else {
        return context.octokit.checks.create({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          name: "Build",
          head_sha: context.payload.head_commit.id,
          status: "completed",
          conclusion: "failure",
        });
      }
    });

    app.on(
      [
        "installation.created",
        "installation_repositories.added",
        "installation_repositories.removed",
      ],
      async (context) => {
        console.log(
          context.payload.repositories_added,
          context.payload.repositories_removed,
          context.payload.repositories,
        );
        axios.post(process.env.URL + "/repos", {
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
        });
      },
    );
  });
};
