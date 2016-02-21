---
layout: post
title:  "GitHub and Composer project workflow"
description: "Workflow when working in a project with GitHub and Composer"
date:   2016-02-21 12:50:00 +0100
tags: [ github, composer ]
comments: true
author: itrascastro
---

I will describe the workflow with a project using GitHub and Composer.

## GitHub

The working branch will be the master branch. When the code becomes stable, we
can either:

- create a new version branch from the master branch
- update an existing branch from the master branch

The version of the project must be setted in the composer.json file.

In the second case (updating) I will remove the composer.json and composer.lock
before updating from the destination branch.

## Releases

Now is time to create a new release to allow users download the new version of
the code.

We go to the GitHub page of the repository and select 'releases' from there.

Then we create a new release 'Draft a new release'. We must create a new Tag
version (i.e. v1.0.3) and select the branch where the code is in that version.

## Composer

Now the new release has been created we can install the new version of the project
as always:

```
composer create-project itrascastro/symfony-3-base-project my_project_name
```

Then the new version of the code will be installed from packagist.org

Remember to update the README.md file with the updates.

Maybe it can be done in a better way but this works for me.
