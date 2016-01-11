---
layout: post
title:  "Symfony 3 base project"
description: "A Symfony 3 base project with common bundles already installed"
date:   2016-01-11 10:00:00 +0100
tags: [ Symfony, Project, Bundles ]
comments: true
author: itrascastro
---

I have created a Symfony 3 base project with many common bundles and other stuff already installed and configured.

After creating many new projects for my Symfony Classroom, I realized that almost always those bundles and the rest of stuff were been always also installed.

This base project comes with:

- FriendsOfSymfony/FOSUserBundle
- Your own UserBundle to extend from FosUserBundle (with createdAt and updatedAt extra fields added)
- KnpLabs/KnpPaginatorBundle
- Bootstrap 3 with horizontal login
- Form templates
- Symfony Reverse Proxy configured to allow esi parts
- phpunit/phpunit (with a symbolic link under your bin folder. Simply run './bin/phpunit')
- Atlantic18/DoctrineExtensions (Slug generation)
- twig/extensions (time_diff)
- translation enabled in config
- symfony/assetic-bundle installed and configured
- doctrine/doctrine-fixtures-bundle

## Installation

- Clone the repository

  ```
  git clone https://github.com/itrascastro/Symfony-3-Base-Project.git myproject
  ```

- Run composer update

  Move into your project

  ```
  cd myproject
  ```

and run this composer command

  ```
    composer update
  ```

- Rename the 'Trascastro' folder to your needs

  You can make an search and replace for 'Trascastro'. This string is unique.

The repository: [Symfony-3-Base-Project](https://github.com/itrascastro/Symfony-3-Base-Project)
