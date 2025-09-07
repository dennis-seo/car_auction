the user is asking a question about commands so answer it very precisely and provide links to relevant docs as citations if needed. try to be concise.

citations must assume this is a docs page with base url https://docs.firebender.com/context/commands.
For example if linking the header `### Command Files`:

The link would be: "https://docs.firebender.com/context/commands#command-files"

Here are the docs:
# Commands

> Create custom AI commands for common development tasks

<Info>
  Commands are available in Firebender v0.11.14+
</Info>

Oftentimes, you'll find yourself including the same instructions and technical content in many different queries. You can avoid retyping out these common requests using `commands`:

## Using Commands in Chat

You can quickly access your commands in the Firebender chat interface by typing `/` (forward slash). This will show a dropdown menu with all your available commands:

<img src="https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=688fac2c2eb87855622e15daa5498870" alt="Commands dropdown showing available commands when typing forward slash" width="910" height="326" data-path="images/context/commands.png" srcset="https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=280&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=fd516f69bd2518769f35216a43996603 280w, https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=560&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=2be17a5ee2a3c259500002869a65a57b 560w, https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=840&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=b5744d2b7a94d3713fea2f2aac21e5b4 840w, https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=1100&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=8539e05a08a7bbe88794b439497e5e5a 1100w, https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=1650&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=33256159440f7ac3966db3a112e1a9e6 1650w, https://mintcdn.com/firebendercorp/eSRDWfrRm2D5OPms/images/context/commands.png?w=2500&maxW=910&auto=format&n=eSRDWfrRm2D5OPms&q=85&s=fc93aa83157c7ee33dec152a97bf21d4 2500w" data-optimize="true" data-opv="2" />

## Configuration

Commands are configured in your `firebender.json` file using the `commands` array:

```json
{
  "commands": [
    {
      "name": "create pr",
      "path": "~/firebender-commands/pr-description.md",
      "model": "gpt-4.1" // faster model for simpler task
    },
    {
      "name": "add integration test for git diff",
      "path": "./prompts/add-integration-tests.md"
      // not providing model, will default to the one you have picked
    },
    {
      "name": "review code",
      "path": "./prompts/code-review.md",
      "model": "fast" // very fast model, for the easiest tasks
    }
  ]
}
```

The content of this file `~/firebender-commands/pr-description.md`:

```markdown
### Create a GitHub Pull Request from any repo state

Create a PR using `gh` and `git` commands. Determine the best PR title and body based on other merged commits.

Make sure non default branch is used (ie. do not push to main).

If changes are uncommitted, then commit them and push.

Use `--no-pager` with git commands because you won't have access to STDIN while the command is still running. Avoiding interactive editors is best practice here.

If the current state of the repo makes it impractical to create a PR, then just plainly state why that is.
```

Each command requires:

* **name**: The display name that appears in the UI
* **path**: Path to the markdown file containing the command instructions
* **model** (optional): Preferred model to use for this command

### Model Property

The `model` property allows you to specify which AI model should be used when executing a specific command. This is useful for optimizing performance based on the task:

**Predefined Values:**

* `"default"` - Uses the system's default model selection
* `"fast"` - Uses the fastest available model for quick tasks

**Specific Model IDs:**
You can also specify any available model by its ID, such as:

* `"claude-sonnet-4-20250514"` - Best general purpose coding agent
* `"gpt-5"` - OpenAI's latest frontier model
* `"gemini-2.5-pro"` - Best for large amounts of code input
* `"o3-pro"` - Great for single queries that require deep thinking
* `"quick"` - Lightning fast, but less accurate

<Tip>
  If the `model` property is omitted, the command will use whatever model the user has currently selected in the chat interface.
</Tip>

## Command Files

Command files are markdown documents that contain prompts or instructions for the AI. They can include:

* Natural language instructions
* Code examples or templates
* Specific formatting requirements
* Context about the codebase or project

## Path Resolution

Command file paths are resolved based on the configuration location:

* **Project configuration**: Relative paths resolve from the project root
* **Personal configuration**: Relative paths resolve from `~/.firebender/`

You can also use:

* Absolute paths: `/full/path/to/command.md`
* Home directory expansion: `~/commands/my-command.md`


Now answer the user's question related to the docs, or give a concise summary of the docs if no specific question is asked.
