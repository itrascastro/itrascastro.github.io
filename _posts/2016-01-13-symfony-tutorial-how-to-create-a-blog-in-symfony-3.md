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

TimeZone

  heroku config:add TZ="Europe/Madrid"

Heroku logs

  heroku logs --tail

  http://stackoverflow.com/questions/2671454/heroku-how-to-see-all-the-logs

If you get an error like this in your logs:

  bash: bin/heroku-php-apache2: No such file or directory

update your Procfile file:

  if the server is at EEUU

  web: vendor/bin/heroku-php-apache2 web/

  if the server is at Europe

  web: vendor/heroku/heroku-buildpack-php/bin/heroku-php-apache2 web/

Now we have our app deployed at Heroku.

Database Settings

Go to resources and add ClearDB MySQL :: Database

A new config var CLEARDB_DATABASE_URL is created with the database url.

To modify the credentials we click on the new created addon, then we click the link under My Databases, and then
we go to Endpoint Information section.

To obtain the credentials from PHP:

<?php
$url = parse_url(getenv("CLEARDB_DATABASE_URL"));

$server = $url["host"];
$username = $url["user"];
$password = $url["pass"];
$db = substr($url["path"], 1);

$conn = new mysqli($server, $username, $password, $db);
?>

https://devcenter.heroku.com/articles/cleardb#using-cleardb-with-php

But as we are going to set our parameters.yml from the composer.json file, we need to create the Database environment vars under Settings->Reveal Config Vars in our Heroku panel. We get the data from the connection string to our Database or we can also go to the Database panel itself.

mysql://b2defcff8a5161:becd1334@us-cdbr-iron-east-04.cleardb.net/heroku_c7a2323f671faf1?reconnect=true

SYMFONY__DATABASE_HOST
SYMFONY__DATABASE_NAME
SYMFONY__DATABASE_PASSWORD
SYMFONY__DATABASE_USER

and we have now to make those values available at our config/parameters.yml file. To do that we use the composer 'extra' section:

      "extra": {
        "symfony-app-dir": "app",
        "symfony-bin-dir": "bin",
        "symfony-var-dir": "var",
        "symfony-web-dir": "web",
        "symfony-tests-dir": "tests",
        "symfony-assets-install": "relative",
        "incenteev-parameters": {
            "file": "app/config/parameters.yml",
            "env-map": {
                "database_name": "SYMFONY__DATABASE_NAME",
                "database_user": "SYMFONY__DATABASE_USER",
                "database_host": "SYMFONY__DATABASE_HOST",
                "database_password": "SYMFONY__DATABASE_PASSWORD"
            }
        },

Finally as we are using github we can connect with heroku and make deployments automatically every time we make changes to the master branch:

Deploy->Deployment Method->GitHub and enable automatic deploys

Now our app is ready for development and for production. I think is better going testing functionalities in production while going creating them.

Heroku ssh

heroku run bash

type "exit" for quit ssh

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
