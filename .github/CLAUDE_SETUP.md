# Claude PR Reviewer - Setup Guide

This guide walks you through setting up the Claude PR reviewer for your Devovia repository.

---

## Prerequisites

- GitHub repository with admin access
- Anthropic API key (Claude API access)
- GitHub Actions enabled on your repository

---

## Step 1: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy the API key (you won't be able to see it again)

---

## Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key from Step 1
5. Click **Add secret**

---

## Step 3: Verify Workflow Files

Ensure these files exist in your repository:

```
.github/
├── workflows/
│   └── claude-pr-review.yml      # Main workflow
├── CLAUDE_CONTEXT.md              # Project context for Claude
├── claude-review-templates.md     # Review templates
└── CLAUDE_SETUP.md                # This file
```

All files should already be in your repository. If not, they need to be committed.

---

## Step 4: Commit and Push

If you just created these files, commit and push them:

```bash
git add .github/
git commit -m "feat: add Claude PR reviewer workflow"
git push origin main
```

---

## Step 5: Test the Workflow

### Option 1: Create a Test PR

1. Create a new branch:

   ```bash
   git checkout -b test/claude-reviewer
   ```

2. Make a small change (e.g., add a comment to a file)

3. Commit and push:

   ```bash
   git add .
   git commit -m "test: trigger Claude reviewer"
   git push origin test/claude-reviewer
   ```

4. Create a Pull Request on GitHub

5. The Claude reviewer should automatically comment on your PR within a few minutes

### Option 2: Trigger on Existing PR

On any open PR, add a comment with:

```
@claude please review this PR
```

Claude will analyze the PR and provide feedback.

---

## How It Works

### Automatic Triggers

The workflow runs automatically when:

- A new PR is opened
- A PR is updated (new commits pushed)
- A PR is marked as "ready for review"
- A PR is reopened

### Manual Triggers

You can also trigger Claude manually by:

- Commenting `@claude` on a PR
- Adding the `claude` label to a draft PR

### What Claude Reviews

Claude analyzes:

- **API Response Standardization**: Checks if responses follow the standard format
- **Type Safety**: Verifies TypeScript types are properly defined
- **Security**: Checks authentication, validation, and data exposure
- **Code Quality**: Reviews for SOLID principles, DRY violations
- **Testing**: Ensures tests exist for new functionality
- **Performance**: Identifies N+1 queries, missing pagination
- **Package Management**: Verifies pnpm usage

---

## Understanding Claude's Comments

### Comment Structure

Each Claude comment follows this format:

```markdown
**Issue**: [Brief description of the problem]

**Suggestion**: [Specific recommendation]

**Example**: [Code example if applicable]

**Reason**: [Why this change improves the code]
```

### Comment Types

- 🔒 **Security Issues** - Critical, fix immediately
- 📊 **API Standardization** - Required for consistency
- 🎯 **Type Safety** - Prevents runtime errors
- 🏗️ **Code Quality** - Improves maintainability
- 🧪 **Testing** - Ensures quality
- ⚡ **Performance** - Improves user experience

### Resolving Comments

1. Make the suggested changes in your code
2. Commit and push the changes
3. Mark the conversation as "Resolved" on GitHub

---

## Customizing the Reviewer

### Adjust Review Focus

Edit `.github/workflows/claude-pr-review.yml` to modify what Claude reviews:

```yaml
prompt: |
  # Add or remove review focus areas here

  ## Review Focus Areas

  ### 1. Your Custom Focus Area
  - Custom check 1
  - Custom check 2
```

### Change Review Strictness

Modify the prompt to be more or less strict:

```yaml
# Stricter reviews
prompt: |
  Be very thorough and flag even minor issues.

# Lenient reviews
prompt: |
  Focus only on critical security and type safety issues.
```

### Skip Certain Files

Add file patterns to skip:

```yaml
claude_args: |
  --allowedTools "..."
  --excludePatterns "*.test.ts,*.spec.ts,dist/**"
```

---

## Troubleshooting

### Claude Doesn't Comment

**Check:**

1. Is the `ANTHROPIC_API_KEY` secret set correctly?
2. Does the workflow file exist in `.github/workflows/`?
3. Is the PR from a fork? (Secrets aren't available to forks for security)
4. Check the Actions tab for workflow run errors

**Solution:**

- Go to **Actions** tab in GitHub
- Find the failed workflow run
- Check the logs for error messages

### Claude Comments Are Too Generic

**Issue**: Claude posts "I'll analyze this" but doesn't provide specific feedback.

**Solution**: This is usually a temporary issue. The workflow is configured to create inline comments. If it persists:

1. Check the workflow logs
2. Ensure `mcp__github_inline_comment__create_inline_comment` tool is allowed
3. Verify the PR has actual code changes to review

### Workflow Runs on Every Commit

**Issue**: Too many workflow runs consuming API credits.

**Solution**: Modify the workflow triggers:

```yaml
on:
  pull_request:
    types: [opened, ready_for_review] # Remove 'synchronize'
```

### API Rate Limits

**Issue**: Hitting Anthropic API rate limits.

**Solution**:

1. Upgrade your Anthropic API plan
2. Limit workflow runs (see above)
3. Use the `claude` label to manually trigger reviews only when needed

---

## Cost Management

### Estimating Costs

Claude API pricing (as of 2024):

- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
- Average PR review: ~10,000-50,000 tokens
- Estimated cost per review: $0.10 - $0.50

### Reducing Costs

1. **Limit to important PRs**: Only add `claude` label to PRs that need thorough review
2. **Skip draft PRs**: The workflow already skips drafts by default
3. **Reduce context**: Edit `CLAUDE_CONTEXT.md` to be more concise
4. **Use manual triggers**: Remove automatic triggers and only use `@claude` comments

---

## Best Practices

### For PR Authors

1. **Write clear PR descriptions**: Help Claude understand the context
2. **Keep PRs focused**: Smaller PRs get better reviews
3. **Address comments promptly**: Mark conversations as resolved when fixed
4. **Ask questions**: Use `@claude` to ask for clarification

### For Reviewers

1. **Review Claude's comments**: Claude is a tool, not a replacement for human review
2. **Provide context**: If Claude misses something, add it to `CLAUDE_CONTEXT.md`
3. **Update templates**: Improve `claude-review-templates.md` based on common issues
4. **Give feedback**: If Claude's reviews aren't helpful, adjust the workflow prompt

---

## Advanced Configuration

### Multiple Review Profiles

Create different workflows for different types of PRs:

```yaml
# .github/workflows/claude-security-review.yml
name: Claude Security Review
on:
  pull_request:
    paths:
      - "apps/api/**"
      - "**/auth/**"
# Focus only on security issues
```

### Integration with Other Tools

Combine with other CI checks:

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test

  claude-review:
    needs: tests # Only run if tests pass
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
```

### Custom Review Templates

Create project-specific templates in `claude-review-templates.md`:

```markdown
### Template: Devovia-Specific Pattern

**Issue**: Not following Devovia's [specific pattern]

**Suggestion**: Use the established pattern

**Example**: [Your code example]

**Reason**: Maintains consistency with existing codebase
```

---

## Support and Resources

### Documentation

- **Anthropic Claude API**: https://docs.anthropic.com/
- **GitHub Actions**: https://docs.github.com/actions
- **Claude Code Action**: https://github.com/anthropics/claude-code-action

### Internal Resources

- **Project Context**: `.github/CLAUDE_CONTEXT.md`
- **Review Templates**: `.github/claude-review-templates.md`
- **API Standards**: `apps/api/API_RESPONSE_STANDARDIZATION.md`

### Getting Help

If you encounter issues:

1. Check the **Actions** tab for workflow logs
2. Review this setup guide
3. Check Anthropic API status
4. Contact your team's DevOps lead

---

## Maintenance

### Regular Updates

**Monthly**:

- Review Claude's feedback quality
- Update `CLAUDE_CONTEXT.md` with new patterns
- Add new templates to `claude-review-templates.md`

**Quarterly**:

- Review API usage and costs
- Update workflow to latest `claude-code-action` version
- Gather team feedback on review quality

**As Needed**:

- Update when major architectural changes occur
- Adjust when new tech stack components are added
- Refine when review quality decreases

---

## Success Metrics

Track these metrics to measure effectiveness:

- **Review Coverage**: % of PRs reviewed by Claude
- **Issue Detection**: # of bugs caught before merge
- **Review Quality**: Team satisfaction with Claude's feedback
- **Time Saved**: Reduction in human review time
- **Cost Efficiency**: API costs vs. value provided

---

**Last Updated**: January 2026
**Version**: 1.0
