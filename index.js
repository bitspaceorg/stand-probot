/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export default (app) => {
	app.on("pull_request.opened", async (context) => {
		try {
			const res = await axios.post(`${process.env.URL}/build`, { repolink: context.payload.html_url });
			const review = {
				owner: context.payload.repository.owner.login,
				repo: context.payload.repository.name,
				pull_number: context.payload.number,
				body: res.data.status === "ok" ? "Hooray, the build passed!" : "Sorry, the build failed!",
				event: res.data.status === "ok" ? "APPROVE" : "REQUEST_CHANGES",
			};
			return context.octokit.pulls.createReview(review);
		} catch (error) {
			console.error("Error creating pull request review:", error);
		}
	});

	app.on("push", async (context) => {
		try {
			const res = await axios.post(`${process.env.URL}/build`, { repolink: context.payload.html_url });
			const check = {
				owner: context.payload.repository.owner.login,
				repo: context.payload.repository.name,
				name: "Build",
				head_sha: context.payload.head_commit.id,
				status: "completed",
				conclusion: res.data.status === "ok" ? "success" : "failure",
			};
			return context.octokit.checks.create(check);
		} catch (error) {
			console.error("Error creating check:", error);
		}
	});

	const handleInstallation = async (context) => {
		console.log("Installation event:", context.name);
		try {
			const repos = [];

			if (context.payload.repositories_added) {
				for (const repo of context.payload.repositories_added) {
					repos.push(repo.name, `https://github.com/${repo.full_name}`);
				}
			}

			if (context.payload.repositories) {
				for (const repo of context.payload.repositories) {
					repos.push(repo.name, `https://github.com/${repo.full_name}`);
				}
			}

			console.log("Repositories to be added:", repos);
			await axios.post(`${process.env.URL}/repos`, { repos });
		} catch (error) {
			console.error("Error handling installation:", error);
		}
	};

	app.on("installation.created", handleInstallation);
	app.on("installation_repositories.added", handleInstallation);
};
