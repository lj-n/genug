# GitHub Repository Rename Swap: `genug` ↔ `genug-da`

**Research Date:** July 21, 2026  
**Scope:** Official GitHub documentation only (docs.github.com, cli.github.com, GitHub REST API)  
**Plan:** Rename `lj-n/genug` → `lj-n/genug-legacy`, rename `lj-n/genug-da` → `lj-n/genug`, archive `lj-n/genug-legacy`

---

## Findings by Question

### (a) Freeing a Repository Name After Rename

**Question:** After renaming `lj-n/genug` → `lj-n/genug-legacy`, is the name `genug` immediately available for another repo under the same owner?

**Answer:** **YES, immediately available.**

**Official Source:**
> "If you create a new repository under your account in the future, do not reuse the original name of the renamed repository. If you do, redirects to the renamed repository will no longer work."

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

**Interpretation:** GitHub's warning against *reusing* the old name implies the name *can* be reused; it's just that the redirect ceases to work if you do. This means the name is freed immediately upon rename and can be claimed by a new repo without delay.

---

### (b) Redirect Behavior: What Happens When a New Repo Claims the Old Name

**Question:** When a new repo is created at (or renamed to) the old name `lj-n/genug`, what happens to the redirect from the renamed repo?

**Answer:** **Redirects are removed and replaced.** When a new repository claims an old name, the redirect from the renamed repository to its new location stops working.

**Official Source:**
> "If you create a new repository under your account in the future, do not reuse the original name of the renamed repository. If you do, redirects to the renamed repository will no longer work."

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

**Redirect Mechanics for Git Operations:**
> "All `git clone`, `git fetch`, or `git push` operations targeting the previous location will continue to function as if made on the new location."

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

**No URL 404 Window:** All existing information is automatically redirected at the moment of rename. There is no window where URLs 404; the redirect is immediate. However, when a new repo claims the old name, that new repo will be what resolves at the old URL, and redirect to the renamed repo ceases.

**Git Remotes:** Old `git remote` URLs that still point to the old name continue to work *due to the redirect*, but GitHub recommends updating them to avoid confusion:
> "all git clone, git fetch, or git push operations targeting the previous location will continue to function as if made on the new location... we recommend updating any existing local clones by running `git remote set-url origin NEW_URL`"

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

**Important Caveat — GitHub Actions:** When a repository that *hosts* a GitHub Action is renamed, workflows that reference that action will break:
> "GitHub will not redirect calls to an action hosted by a renamed repository, and any workflow that uses that action will fail with the error repository not found."

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

---

### (c) GitHub Container Registry (ghcr.io) Package Behavior on Repo Rename

**Question:** What happens to an existing ghcr.io package when its linked source repo is renamed?

#### **Scope: Owner-Level, Not Repository-Level**

**Official Source:**
> "The permissions for packages can be scoped either to a user or an organization or to a repository."

**Citation:** [About permissions for GitHub Packages - GitHub Docs](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)

**Container Registry Specifics:**
> "In registries that support granular permissions, packages are scoped to a personal account or organization."

**Citation:** [Configuring a package's access control and visibility - GitHub Docs](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)

**Key Implication:** Packages are scoped to `lj-n` (owner), not to a specific repository. Renaming a repository does NOT rename its packages; the package `ghcr.io/lj-n/genug-da` remains at that address regardless of the source repo name.

#### **Package Naming: Independent of Repository Name**

**Official Finding:** GitHub's documentation does not explicitly state what happens to a container package's name when its linked source repository is renamed. However, the scoping model strongly suggests the package name is independent: since packages are owner-scoped, not repo-scoped, and you can push to a package name that doesn't match any repository, the package name persists.

#### **First Push Creates a New Package with Default Privacy: Private**

**Official Source:**
> "When you first publish a package, the default visibility is private."

**Citation:** [Working with the Container registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

#### **Repository Linking: Manual, Not Automatic**

**Official Source:**
> "When you push a container image from the command line, the image is not linked to a repository by default, even if you tag the image with a namespace that matches the name of the repository."

**Citation:** [Connecting a repository to a container image - GitHub Docs](https://docs.github.com/en/packages/guides/connecting-a-repository-to-a-container-image)

**How to Link:**
1. Use the `org.opencontainers.image.source` label in your Dockerfile: `LABEL org.opencontainers.image.source=https://github.com/OWNER/REPO`
2. Or manually link in the package's GitHub web interface after creation.

**Citation:** [Connecting a repository to a container image - GitHub Docs](https://docs.github.com/en/packages/guides/connecting-a-repository-to-a-container-image)

#### **Package Visibility: Independent of Repository Visibility**

**Official Source:**
> "In registries that support granular permissions, you can choose whether to inherit permissions from a repository, or set granular permissions independently of a repository... anyone with admin permissions to the package can set the package to private or public, and can grant access permissions for the package that are separate from the permissions set at the organization and repository levels."

**Citation:** [Configuring a package's access control and visibility - GitHub Docs](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)

**Implication:** A ghcr package can be public even if its linked repo is private, or vice versa.

#### **GITHUB_TOKEN Permissions for Publishing**

**Official Source:**
> "You can use the `GITHUB_TOKEN` to publish, install, delete, and restore packages in GitHub Packages without needing to store and manage a personal access token."

**Citation:** [Publishing and installing a package with GitHub Actions - GitHub Docs](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions)

**Recommended Workflow Permissions:**
```yaml
permissions:
  packages: write
  contents: read
```

**Citation:** [Publishing Docker images - GitHub Docs](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

**Important Caveat:** Adding the `org.opencontainers.image.source` label ensures GITHUB_TOKEN has appropriate permissions:
> "If you have previously pushed a package to the same namespace, but have not connected the package to the repository, the GITHUB_TOKEN will not have permission to push the package. To address this, we recommend adding the label `org.opencontainers.image.source` to your Dockerfile."

**Citation:** [Publishing Docker images - GitHub Docs](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

#### **Publishing Under a New Package Name**

When you push to a new package name (e.g., `ghcr.io/lj-n/genug` vs. `ghcr.io/lj-n/genug-da`):
- A new package is created automatically on first push.
- Default visibility is private.
- It is NOT automatically linked to any repository; you must add the `org.opencontainers.image.source` label or manually link it.

**Citation:** [Working with the Container registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

### (d) Archive Timing: Does It Affect Redirects or Name Reuse?

**Question:** Does archiving a repository affect its rename redirects or the ability of another repo to claim its former name? Can an archived repo still be renamed or unarchived?

**Official Finding on Archives:** GitHub's documentation on archiving repositories does not explicitly address:
- Whether archiving affects redirects
- Whether archiving prevents renaming
- Whether archiving allows another repo to claim the archived repo's name

**Official Source on Archiving:**
> "When you archive a repository, its issues, pull requests, code, labels, milestones, projects, wiki, releases, commits, tags, branches, reactions, code scanning alerts, comments and permissions become read-only."

**Citation:** [Archiving repositories - GitHub Docs](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)

**Unarchiving Is Possible:**
> "false will unarchive a previously archived repository"

**Citation:** [REST API endpoints for repositories - GitHub Docs](https://docs.github.com/en/rest/repos/repos) (PATCH /repos/{owner}/{repo} with `archived: false`)

**Recommendation from Official Docs on Renamed Actions:**
> "Instead, create a new repository and action with the new name and archive the old repository."

**Citation:** [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)

**Implication:** Archiving is recommended *after* the rename/move is complete, but the documentation provides no evidence that archiving timing affects redirects or name availability. Archiving appears to be a housekeeping step that makes the old repo read-only without interfering with redirect mechanics.

---

## GitHub CLI Commands (gh)

### Rename a Repository

**Command:**
```bash
gh repo rename <new-name>
```

**Flags:**
- `-R, --repo [HOST/]OWNER/REPO` — Specify a repository other than the current one
- `-y, --yes` — Skip confirmation prompt

**Official Source:**
[GitHub CLI manual: gh repo rename](https://cli.github.com/manual/gh_repo_rename)

**Example (rename current repo from `genug-da` to `genug`):**
```bash
gh repo rename genug
```

**Example (rename a specific repo):**
```bash
gh repo rename -R lj-n/genug-da genug
```

### Archive a Repository

**Command:**
```bash
gh repo archive [<repository>]
```

**Flags:**
- `-y, --yes` — Skip confirmation prompt

**Official Source:**
[GitHub CLI manual: gh repo archive](https://cli.github.com/manual/gh_repo_archive)

**Example (archive current repo):**
```bash
gh repo archive
```

**Example (archive a specific repo):**
```bash
gh repo archive -R lj-n/genug-legacy
```

**Example (skip confirmation):**
```bash
gh repo archive -R lj-n/genug-legacy -y
```

### Edit Repository Description/Homepage

**Command:**
```bash
gh repo edit [<repository>] [flags]
```

**Relevant Flags:**
- `-d, --description <string>` — Set repository description
- `-h, --homepage <URL>` — Set repository homepage URL
- `--add-topic <strings>` — Add a topic

**Official Source:**
[GitHub CLI manual: gh repo edit](https://cli.github.com/manual/gh_repo_edit)

**Example (add description and redirect link to current repo):**
```bash
gh repo edit -d "Legacy prototype (archived). Active development moved to lj-n/genug."
gh repo edit -h "https://github.com/lj-n/genug"
```

### REST API Equivalent for Rename and Archive

**PATCH /repos/{owner}/{repo}**

**Endpoint:** `https://api.github.com/repos/OWNER/REPO`

**Updatable Fields (relevant to this plan):**
- `name` — the repository name
- `archived` — boolean; `false` unarchives
- `description` — repository description
- `homepage` — repository homepage URL

**Citation:** [REST API endpoints for repositories - GitHub Docs](https://docs.github.com/en/rest/repos/repos)

**Example (rename via curl):**
```bash
curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/lj-n/genug-da \
  -d '{"name":"genug"}'
```

**Example (archive via curl):**
```bash
curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/lj-n/genug-legacy \
  -d '{"archived":true}'
```

---

## Step-by-Step Runbook

This runbook is safe to execute in the order specified. **Irreversible steps** are flagged.

### Prerequisites

- You have admin access to both `lj-n/genug` and `lj-n/genug-da`.
- GitHub CLI (`gh`) is installed and authenticated.
- All local clones have been reviewed; you're prepared to update remotes.

### Step 1: Update Local Clones (Before Any Renames)

Update your local remotes to be explicit about which repo they point to, reducing confusion once redirects are in play:

```bash
cd ~/path/to/genug-da-local-clone
git remote set-url origin https://github.com/lj-n/genug-da
git remote -v  # verify

cd ~/path/to/genug-local-clone
git remote set-url origin https://github.com/lj-n/genug
git remote -v  # verify
```

**Why first:** Makes it easier to track which repo you're working on during the rename sequence. Not strictly required (redirects will keep old URLs working), but recommended by GitHub.

---

### Step 2: Rename `lj-n/genug` → `lj-n/genug-legacy`

**Command:**
```bash
gh repo rename -R lj-n/genug genug-legacy -y
```

**What happens:**
- Repository is renamed on GitHub.
- GitHub creates a redirect from `lj-n/genug` → `lj-n/genug-legacy`.
- All git operations targeting the old URL continue to work via redirect.
- The name `genug` is now available for reuse.

**Post-action verification:**
```bash
gh repo view lj-n/genug-legacy
# Should show the renamed repo

# Try accessing the old URL (should redirect)
curl -I https://github.com/lj-n/genug
# Should see a 301/302 redirect to genug-legacy
```

**Irreversible?** Can be reversed by renaming back, but if step 3 happens, reverting this becomes tricky (would break the new repo). See step 4.

---

### Step 3: Rename `lj-n/genug-da` → `lj-n/genug`

**Command:**
```bash
gh repo rename -R lj-n/genug-da genug -y
```

**What happens:**
- Repository is renamed on GitHub.
- GitHub creates a redirect from `lj-n/genug-da` → `lj-n/genug`.
- **The old redirect from `lj-n/genug` → `lj-n/genug-legacy` is now replaced:** the name `genug` is now taken by the new repo, so the previous redirect ceases to work.
- Anyone or any script accessing the old `lj-n/genug-da` URL will now be redirected to the new `lj-n/genug`.

**Post-action verification:**
```bash
gh repo view lj-n/genug
# Should show the renamed repo (former genug-da)

# Verify the redirect
curl -I https://github.com/lj-n/genug-da
# Should see a 301/302 redirect to genug
```

**Old redirect status after this step:**
```bash
curl -I https://github.com/lj-n/genug/
# Now points to the NEW genug (formerly genug-da), NOT to genug-legacy
```

**Impact on ghcr.io:**
- The old package at `ghcr.io/lj-n/genug-da` still exists and is unaffected by the repo rename.
- GitHub Actions workflows using `GITHUB_TOKEN` will continue to work for pushing to `ghcr.io/lj-n/genug-da` (same permissions).
- To use a new package name `ghcr.io/lj-n/genug`, you must update your Actions workflow to push to the new name and ensure the Dockerfile includes: `LABEL org.opencontainers.image.source=https://github.com/lj-n/genug` (updated to the new repo URL).
- The first push to `ghcr.io/lj-n/genug` will create a new package with default visibility: **private**. Update the package visibility if needed.

**Irreversible?** Yes. Once a new repo claims the name, the previous redirect is replaced. To undo, you'd have to rename `genug` back to `genug-da`, which would orphan the `lj-n/genug` name again. **This is the critical point of no return for this plan.**

---

### Step 4: Add Redirect/Documentation to `lj-n/genug-legacy`

**Update the repository description and homepage to redirect users:**

```bash
gh repo edit -R lj-n/genug-legacy \
  -d "ARCHIVED: Prototype of genug. Active development has moved to https://github.com/lj-n/genug."

gh repo edit -R lj-n/genug-legacy \
  -h "https://github.com/lj-n/genug"
```

**Why:** GitHub's redirect from `lj-n/genug` → `lj-n/genug-legacy` is now gone (step 3), so users finding the old repo need a clear pointer to the new one. This makes the repo's purpose and new home explicit.

**Optional: Update README** (if it exists in the repo):
Add a note at the top:
```markdown
# genug-legacy

> **ARCHIVED**: This is an old prototype. Active development has moved to https://github.com/lj-n/genug

...
```

You can edit the README via GitHub's web interface or by pushing a change to the repo directly (requires unarchiving, below).

**Reversible:** Yes, can edit description/homepage anytime.

---

### Step 5: Archive `lj-n/genug-legacy`

**Command:**
```bash
gh repo archive -R lj-n/genug-legacy -y
```

**What happens:**
- Repository becomes read-only for all users.
- Issues, PRs, wiki, and code are all read-only.
- You cannot add/remove collaborators or teams (enforced read-only state).
- The repository remains visible and accessible; it's just locked.

**Temporarily unarchive if needed:**
```bash
curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/lj-n/genug-legacy \
  -d '{"archived":false}'
```

Then update the README, and re-archive.

**Irreversible?** Can be unarchived, so not truly irreversible. But once archived, it signals the repo is no longer maintained.

---

### Step 6: Update Local Clones to New Remote URLs

If you have local clones of the old names, update their remotes to avoid confusion:

**For the renamed `genug-legacy` clone:**
```bash
cd ~/path/to/genug-local-clone
git remote set-url origin https://github.com/lj-n/genug-legacy
git remote -v  # verify
```

**For the renamed `genug` clone:**
```bash
cd ~/path/to/genug-da-local-clone
git remote set-url origin https://github.com/lj-n/genug
git remote -v  # verify
```

**Note:** Old URLs will still work via GitHub's redirect (until you archive), but updating them avoids surprises and makes your repo state clearer.

**Optional: Update any CI/CD references** in Actions workflows, deploy scripts, or documentation that hardcode repository URLs.

---

### Step 7: Update GitHub Actions Workflow (ghcr Publishing)

**If your Actions workflow pushes to `ghcr.io/lj-n/genug-da`:**

**Current workflow structure (example):**
```yaml
- name: Push to ghcr
  run: |
    docker tag myimage:latest ghcr.io/lj-n/genug-da:latest
    docker push ghcr.io/lj-n/genug-da:latest
```

**Updated workflow (push to new package name):**
```yaml
- name: Push to ghcr
  run: |
    docker tag myimage:latest ghcr.io/lj-n/genug:latest
    docker push ghcr.io/lj-n/genug:latest
```

**Ensure Dockerfile includes the source label (for linkage and GITHUB_TOKEN permissions):**
```dockerfile
LABEL org.opencontainers.image.source=https://github.com/lj-n/genug
```

**Citation:** [Connecting a repository to a container image - GitHub Docs](https://docs.github.com/en/packages/guides/connecting-a-repository-to-a-container-image)

**First push:** Creates a new package `ghcr.io/lj-n/genug` with default visibility **private**. Adjust visibility if needed in the package settings after the first successful push.

**Old package:** `ghcr.io/lj-n/genug-da` remains accessible for any systems still using it; you can keep both packages published during a deprecation period if desired.

---

## Summary of Critical Steps

| Step | Action | Reversible? | Notes |
|------|--------|-------------|-------|
| 1 | Update local git remotes | Yes | Not required but recommended |
| 2 | Rename `genug` → `genug-legacy` | Somewhat | Redirect set up; reverting requires re-rename before step 3 |
| **3** | **Rename `genug-da` → `genug`** | **Somewhat** | **Critical point: Previous redirect is replaced. After this, reverting requires renaming `genug` back to `genug-da`, orphaning the name.** |
| 4 | Add pointer to `genug-legacy` README/description | Yes | Users need a way to find the new repo |
| 5 | Archive `genug-legacy` | Yes | Can unarchive if needed; signals repo is no longer maintained |
| 6 | Update local clone remotes to new URLs | Yes | Optional but recommended for clarity |
| 7 | Update Actions workflow for ghcr publishing | Yes | Must push to new package name; old package persists |

---

## Surprises & Caveats

### 1. **Redirects Aren't Transitive**
After step 3, the redirect from `lj-n/genug` no longer points to `lj-n/genug-legacy`; it points to the *new* `lj-n/genug` (formerly `genug-da`). Anyone using the old `lj-n/genug` URL will be silently redirected to the new repo. **Always add a pointer in `genug-legacy`'s description and README to prevent confusion.**

### 2. **GitHub Actions Workflows Break on Rename (If Hosted Actions)**
If your old `genug` repository *hosted* a custom GitHub Action, workflows referencing it will break with "repository not found." The `genug-legacy` repo will not resolve action references. (This does not apply to your plan, which just renames the app repo, not an action repo.)

### 3. **ghcr Package Name Is Independent of Repo Name**
Renaming the repository does **not** rename the package. `ghcr.io/lj-n/genug-da` persists even after the repo is renamed. You must explicitly push to the new package name `ghcr.io/lj-n/genug` to create it. Both packages can coexist.

### 4. **New ghcr Package Is Private by Default**
When you push `ghcr.io/lj-n/genug` for the first time, GitHub creates the package with **private** visibility. If you want it public, you must change visibility in the package settings or via API after creation.

### 5. **Linking a ghcr Package to Its Repo Is Manual**
The package `ghcr.io/lj-n/genug` is NOT automatically linked to the renamed repo `lj-n/genug`, even if you push it after the rename. Add the `org.opencontainers.image.source` label to your Dockerfile or manually link in the package settings to enable repository info on the package landing page.

### 6. **Archive Does NOT Affect Redirect Mechanics**
There is no documentation stating that archiving a repo affects its redirects or its ability to be renamed. Archiving is a read-only lock; the redirect persists. You can unarchive, rename, or update a repo even after archiving (after unarchiving). Archiving is a housekeeping step, not a prerequisite for redirect behavior.

### 7. **Backward Compatibility Window**
After step 3 completes, the old `lj-n/genug-da` URL will redirect to the new `lj-n/genug`. Any scripts, CI/CD configs, or documentation hardcoding `genug-da` will silently work (they'll follow the redirect). **Update them anyway** to avoid long-term confusion and future fragility (if `genug-da` is reused later, the redirect will break).

### 8. **GITHUB_TOKEN Permissions Persist Across Renames**
Actions workflows using `GITHUB_TOKEN` will continue to have the same permissions (including `packages:write`) after the repo is renamed. The token is repository-scoped, not name-scoped, so token-based operations remain unaffected.

---

## Risk Assessment

**Highest risk steps (in order of consequence):**
1. **Step 3 (Rename `genug-da` → `genug`)** — Once executed, reversing requires orphaning or renaming `genug` again, causing disruption to users of the new `lj-n/genug` URL.
2. **Step 7 (Update Actions workflow)** — If not updated, the workflow will keep pushing to the old package name, potentially causing confusion about which package is the canonical one.

**Mitigation:**
- Run step 1 (update local remotes) first to avoid confusion during the rename.
- Complete step 4 (add pointers to `genug-legacy`) immediately after step 3 to guide users.
- Test the new Actions workflow with a manual push before relying on it in production.

**No data loss:** Renaming does not delete any code, issues, PRs, or history. All data is preserved and redirected.

---

## References (Official Sources)

1. [Renaming a repository - GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
2. [Archiving repositories - GitHub Docs](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
3. [Working with the Container registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
4. [Connecting a repository to a container image - GitHub Docs](https://docs.github.com/en/packages/guides/connecting-a-repository-to-a-container-image)
5. [Configuring a package's access control and visibility - GitHub Docs](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)
6. [About permissions for GitHub Packages - GitHub Docs](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)
7. [Publishing and installing a package with GitHub Actions - GitHub Docs](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions)
8. [Publishing Docker images - GitHub Docs](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
9. [REST API endpoints for repositories - GitHub Docs](https://docs.github.com/en/rest/repos/repos)
10. [GitHub CLI manual: gh repo rename](https://cli.github.com/manual/gh_repo_rename)
11. [GitHub CLI manual: gh repo archive](https://cli.github.com/manual/gh_repo_archive)
12. [GitHub CLI manual: gh repo edit](https://cli.github.com/manual/gh_repo_edit)
