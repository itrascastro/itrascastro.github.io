---
layout: post
title:  "Symfony 3 base project with some common bundles installed"
description: "A Symfony 3 base project with common bundles already installed"
date:   2016-01-11 10:00:00 +0100
tags: [ symfony, project, bundles, library ]
comments: true
author: itrascastro
---

- [GitHub](https://github.com/itrascastro/Symfony-3-Base-Project)
- [Packagist](https://packagist.org/packages/itrascastro/symfony-3-base-project)

I have created a Symfony 3 base project with many common bundles and other stuff already installed and configured.

After creating many new projects for my Symfony Classroom, I realized that, almost always, those bundles and the rest of stuff were been always also installed.

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

Installation
------------

PHP >= 5.5.9 required

## Installing Composer

Composer is the dependency manager used by modern PHP applications and it can also be used to create new applications.

Download the installer from [getcomposer.org/download](https://getcomposer.org/download/), execute it and follow the instructions.

## Creating a new project with Composer

  ```
  php composer.phar create-project itrascastro/symfony-3-base-project my_project_name
  ```

If you did a global install and do not have the composer.phar in that directory run this instead:

  ```
  composer create-project itrascastro/symfony-3-base-project my_project_name
  ```

## Initial Setup

  ```
  php bin/console doctrine:database:create
  ```

  ```
  php bin/console doctrine:schema:create
  ```

  ```
  php bin/console doctrine:fixtures:load
  ```

  ```
  php bin/console server:run
  ```

Now you can login with 'admin' user and '1234' password. Default users are under 'src/AppBundle/DataFixtures/ORM/LoadData.php'
