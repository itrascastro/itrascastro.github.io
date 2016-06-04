---
layout: post
title:  "Symfony tutorial - How to create a blog in Symfony 3"
description: "Learn how to create a blog in Symfony 3"
date:   2016-01-13 11:00:00 +0100
tags: [ symfony tutorial blog ]
comments: true
author: itrascastro
---

The idea is creating a very simple blog in Symfony 3. The goal of this tutorial is to be a quick start in Symfony.

This tutorial will be divided in the following parts:

## Part 1: Installation

The first thing we are going to do is a fresh install of Symfony Framework. At the moment of writing this article current version is 3.1.0.

We go to symfony.com and we download it:

$ sudo curl -LsS https://symfony.com/installer -o /usr/local/bin/symfony
$ sudo chmod a+x /usr/local/bin/symfony
$ symfony new SymfonyBlog

Now we run the PHP integrated web server:

  1. Execute the php bin/console server:run command.
  2. Browse to the http://localhost:8000 URL.

We are going to use Heroku.com for deploying our app, following this tutorial:

  http://symfony.com/doc/current/cookbook/deployment/heroku.html

In PhpStorm IDE we enable now the Symfony Pluggin, changing the cache path wich is now allocated inside the var directory. We restart the IDE to make changes.

For not having problems with IDE code suggestions, we now mark the cache and the logs directories as Excluded.

And others:

  http://stackoverflow.com/questions/35654320/how-to-configure-directories-when-using-a-symfony-project-in-phpstorm

Ignoring the .idea folder from git:

  https://help.github.com/articles/ignoring-files/#global-gitignore

Enabling annotations plugin. Plugins -> Browse repositories -> PHP Annotations

Enablig xdebug in PhpStorm:

  https://www.jetbrains.com/help/phpstorm/10.0/configuring-xdebug.html

Heroku logs

  http://stackoverflow.com/questions/2671454/heroku-how-to-see-all-the-logs

If you get an error like this in your logs:

  bash: bin/heroku-php-apache2: No such file or directory

update your Procfile file:

  bash: bin/heroku-php-apache2: No such file or directory

Now we have our app deployed at Heroku.

## Part 2: The Entities

- Database diagram
- Doctrine console
- Entities generation

## Part 3: FOSUserBundle

- Installing FOSUserBundle

## Part 4: Associations

- Doctrine Associations

## Part 5: Articles

- Articles CRUD

## Part 6: Comments

- Comments CRUD
