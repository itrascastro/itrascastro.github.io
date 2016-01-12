---
layout: post
title:  "Avoid handwriting ACL permissions in Zend Framework"
description: "Zend Framework module for ACL"
date:   2015-03-10 20:34:00 +0100
tags: [ zend framework, library, acl ]
comments: true
author: itrascastro
---

[GitHub repository](https://github.com/itrascastro/TrascastroACL/) |
[Zend Modules](http://zfmodules.com/itrascastro/TrascastroACL) |
[Packagist](https://packagist.org/packages/itrascastro/acl)

One of the things to do in a web application is controlling the access to the different pages. Zend Framework comes with an Acl component for that purpose.

Our task is make a setup of the Acl instance creating the roles, the resources and the permissions of each role over the resources.

One possible solution can be creating a config file with the roles and its allowed routes. You can also use the inheritance system of the Acl for roles.

The problem with that approach is that we will have repeated code in different configuration files: this one for the Acl and the other config files where the routes are defined.

I’ve created an Acl Module for ZF2 that allows you to put your access control information inside the routes. Something like this:

{% highlight php %}
<?php

array(
    'router' => array(
        'routes' => array(
            'user\users\update' => array(
                'type' => 'Segment',
                'options' => array(
                    'route'    => '/admin/users/update/id/:id/',
                    'constraints' => array(
                        'id' => '[0-9]+',
                    ),
                    'defaults' => array(
                        'controller' => 'User\Controller\Users',
                        'action'     => 'update',
                        'roles'      => ['admin', 'moderator'],
                    ),
                ),
            ),
        ),
    ),
);
{% endhighlight %}

With that configuration only users with the roles 'admin' or 'user' would be able to access to that route.

The idea is simple, only the user roles defined under the route can access to that route.

If the array 'roles' is empty or if it is not defined, then the route becomes public.

## TrascastroACL Module

I have created a Factory to setup the default Acl service ('Zend\Permissions\Acl\Acl') parsing the routes of the entire application. So now you will have a new Acl Service ready to use with all the roles, resources (routes) and permissions automatically created.

### The code

The GitHub repository for this module is: [TrascastroACL](https://github.com/itrascastro/TrascastroACL)

The factory takes the default Acl service from the container and also takes the configuration array. Then with the 'roles' and the 'routes' defined in config it creates all the resources, roles and allow rules in the Acl service.

The only thing that we have to take care is that each 'route' can have 'child routes', so we have to parse them recursively.

{% highlight php %}
<?php
/**
 * (c) Ismael Trascastro <i.trascastro@gmail.com>
 *
 * @link        https://github.com/itrascastro/TrascastroACL
 * @copyright   Copyright (c) Ismael Trascastro. (http://www.ismaeltrascastro.com)
 * @license     MIT License - http://en.wikipedia.org/wiki/MIT_License
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
namespace TrascastroACL\Service\Factory;
use Zend\Permissions\Acl\Acl;
class ACLServiceFactory
{
    /**
     * @var Acl
     */
    private $acl;
    /**
     * @var array
     */
    private $roles;
    public function __invoke($serviceLocator)
    {
        $this->acl      = $serviceLocator->get('Zend\Permissions\Acl\Acl');
        $config         = $serviceLocator->get('config');
        $this->roles    = $config['TrascastroACL']['roles'];
        $routes         = $config['router']['routes'];
        foreach ($this->roles as $role) {
            $this->acl->addRole($role);
        }
        foreach ($routes as $route => $value) {
            $this->parseRoute($route, $value);
        }
        return $this->acl;
    }
    /**
     * parseRoute
     *
     * For each route
     *      - It has not a parent route
     *          - It has not child routes
     *          - It has child routes
     *              - It can be alone (may_terminate == true)
     *              - It can't be alone (may_terminate == false)
     *      - It has a parent route
     *          - It has not child routes
     *          - It has child routes
     *              - It can be alone (may_terminate == true)
     *              - It can't be alone (may_terminate == false)
     *
     * @param string $route
     * @param array $value
     * @param string $parent
     */
    private function parseRoute($route, $value, $parent = null)
    {
        if (!$parent) {
            if (empty($value['child_routes'])) {
                $this->routeRolesToAcl($route, $value);
            } elseif ($value['may_terminate']) {
                $this->routeRolesToAcl($route, $value);
                $this->iterateChildRoutes($route, $value);
            } else {
                $this->iterateChildRoutes($route, $value);
            }
        } else {
            $route = $parent . '/' . $route;
            if (empty($value['child_routes'])) {
                $this->routeRolesToAcl($route, $value);
            } elseif ($value['may_terminate']) {
                $this->routeRolesToAcl($route, $value);
                $this->iterateChildRoutes($route, $value);
            } else {
                $this->iterateChildRoutes($route, $value);
            }
        }
    }
    /**
     * routeRolesToAcl
     *
     * Creates an allow rule in Acl for that route and its allowed roles
     *
     * @param string $route
     * @param array $value
     */
    private function routeRolesToAcl($route, $value)
    {
        $this->acl->addResource($route);
        $routeRoles = !empty($value['options']['defaults']['roles']) ? $value['options']['defaults']['roles'] : $this->roles;
        $this->acl->allow($routeRoles, $route);
    }
    /**
     * iterateChildRoutes
     *
     * Iterates child routes for a given route parsing each child
     *
     * @param string $route
     * @param array $value
     */
    private function iterateChildRoutes($route, $value)
    {
        foreach ($value['child_routes'] as $childRoute => $childValue) {
            $this->parseRoute($childRoute, $childValue, $route);
        }
    }
}
{% endhighlight %}

### Installation and configuration

Installation of TrascastroACL uses composer. For composer documentation, please refer to [getcomposer.org](http://getcomposer.org).

```
php composer.phar require itrascastro/acl:dev-master
```

**Configuration**

- Add the module name 'TrascastroACL' to your config/application.config.php

{% highlight php %}
<?php
array(
    'modules' => array(
        'Application',
        'TrascastroACL',
    ),
);
{% endhighlight %}

- Copy the 'TrascastroACL.global.dist' from TrascastroACL config directory and paste it to config/autoload folder removing the '.dist' termination. Now add your application roles and also add the 'controller' and the 'action' where the ACL will redirect unallowed access tries. You also need to add a role provider:

{% highlight php %}
<?php
return [
    'TrascastroACL' => [
        'roles' => [
            'guest',
            'user',
            'admin',
        ],
        'forbidden' => [
            'controller' => 'YOUR_FORBIDDEN_MANAGER_CONTROLLER',
            'action'     => 'YOUR_FORBIDDEN_MANAGER_ACTION',
        ],
        'role_provider' => 'YOUR_ROLE_PROVIDER',
    ],
];
{% endhighlight %}

The role provider must implement the interface 'TrascastroACL\Provider\RoleProviderInterface':

{% highlight php %}
<?php
namespace TrascastroACL\Provider;

interface RoleProviderInterface
{
    /**
     * @return String
     */
    public function getUserRole();
}
{% endhighlight %}

This is an example of a role provider class:

{% highlight php %}
<?php
namespace User\Provider;

use TrascastroACL\Provider\RoleProviderInterface;
use Zend\Authentication\AuthenticationServiceInterface;
use Zend\Authentication\AuthenticationService;

class RoleProvider implements RoleProviderInterface
{
    /**
     * @var AuthenticationService
     */
    private $authenticationService;

    /**
     * @param AuthenticationServiceInterface $authenticationService
     */
    public function __construct(AuthenticationServiceInterface $authenticationService)
    {
        $this->authenticationService = $authenticationService;
    }

    /**
     * @return String
     */
    public function getUserRole()
    {
        return ($identity = $this->authenticationService->getIdentity()) ? $identity->role : 'guest';
    }
}
{% endhighlight %}

Where the Factory would be as follows:

{% highlight php %}
<?php
namespace User\Provider\Factory;

use User\Provider\RoleProvider;

class RoleProviderFactory
{
    public function __invoke($serviceLocator)
    {
        $authenticationService = $serviceLocator->get('User\Service\Authentication');

        return new RoleProvider($authenticationService);
    }
}
{% endhighlight %}

Do not forget to add your provider to your module.config.php:

{% highlight php %}
<?php
'service_manager' => array(
    'factories' => array(
        // [ ... ]
        'User\Provider\RoleProvider' => 'User\Provider\Factory\RoleProviderFactory',
    ),
),
{% endhighlight %}

### Usage

Now you can manage your application access control from your routes by simply adding a 'roles' key like in this example:

{% highlight php %}
<?php
array(
    'router' => array(
        'routes' => array(
            'user\users\update' => array(
                'type' => 'Segment',
                'options' => array(
                    'route'    => '/admin/users/update/id/:id/',
                    'constraints' => array(
                        'id' => '[0-9]+',
                    ),
                    'defaults' => array(
                        'controller' => 'User\Controller\Users',
                        'action'     => 'update',
                        'roles'      => ['admin', 'moderator'],
                    ),
                ),
            ),
        ),
    ),
);
{% endhighlight %}

Only users with 'admin' or 'moderator' roles can now access to that route. If you do not create the 'roles' key in a route or you left it empty, then the resource will be public.

#### Accessing the Acl Service

- **From a Controller**

{% highlight php %}
<?php
$acl = $this->serviceLocator->get('TrascastroACL');
{% endhighlight %}

- **onBootstrap**

{% highlight php %}
<?php
namespace MyModule;

use Zend\Mvc\MvcEvent;

class Module implements AutoloaderProviderInterface
{
    public function onBootstrap(MvcEvent $e)
    {
        $sm  = $e->getApplication()->getServiceManager();
        $acl = $sm->get('TrascastroACL');
    }

    ...
}
{% endhighlight %}

- **From Views**

This module provides a View Helper to have access to TrascastroACL in your views:

{% highlight php %}
<?php if ($this->tacl()->isAllowed($this->identity()->role, 'admin\users\update')): ?>
{% endhighlight %}

It is also available using the layout() View Helper:

{% highlight php %}
<?php if ($this->layout()->tacl->isAllowed($this->identity()->role, 'admin\users\update')): ?>
{% endhighlight %}

- **From Layout**

{% highlight php %}
<?php if ($this->tacl()->isAllowed($this->identity()->role, 'admin\users\update')): ?>
{% endhighlight %}

It is also available using a layout variable:

{% highlight php %}
<?php if ($this->tacl->isAllowed($this->identity()->role, 'admin\users\update')): ?>
{% endhighlight %}
