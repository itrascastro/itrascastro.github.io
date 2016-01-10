---
layout: post
title:  "Dependency Injection"
description: "Dependency Injection in PHP tutorial"
date:   2015-03-08 11:00:00 +0100
tags: [ Dependency Injection, PHP ]
comments: true
author: itrascastro
---

We have seen [How to create your own PHP MVC Framework]({% post_url 2014-10-15-how-to-create-your-own-php-mvc-framework %}).

In that approach, the  CalculatorModel instance is created inside the controller in every action:

{% highlight php %}
<?php
public function doSumAction()
{
    $model = new CalculatorModel($_POST['op1'], $_POST['op2']);
    $model->sum();
    $result = $model->getResult();
    require 'application/views/result.phtml';
}
{% endhighlight %}

We say that CalculatorController depends on CalculatorModel because we need a CalculatorModel instance inside the controller.

There is repeated code in every calculator operation where the model is needed. This can be solved creating the model instance in the CalculatorController constructor. But what if we need this service in many other controllers. Same instantiation code will be in every constructor.

The solution for it is creating that dependency outside the controller and then inject it to the controller.

In a professional framework this task is done by an special component called Dependency Injection Container. In our simple framework, as we done with the routing task, it will be done in the index.php file (the Front Controller).

**public/index.php**

{% highlight php %}
<?php
chdir(dirname(__DIR__));
require 'application/controllers/IndexController.php';
require 'application/controllers/CalculatorController.php';
require 'application/models/CalculatorModel.php';
if (!isset($_GET['controller']))
{
    $controllerName = 'controllers\\IndexController';
    $action         = 'indexAction';
    $controller = new $controllerName();
    $controller->$action();
}
else
{
    $controllerName     = 'controllers\\' . ucfirst($_GET['controller']) . 'Controller';
    $action             = $_GET['action'] . 'Action';
    // Dependeny
    $model = new models\CalculatorModel();
    //Dependency Inyection
    $controller = new $controllerName($model);
    $controller->$action();
}
{% endhighlight %}

The model can be injected to the controller via constructor or via setter method. In our implementation we use the constructor.

The setter method can be used when at construction time the instance is not ready for receiving the dependency.

Then we have to modify our controller and to create a new property for the service:

**application/controllers/CalculatorController.php**

{% highlight php %}
<?php
namespace controllers;
use models\CalculatorModel;
class CalculatorController
{
    /**
     * @var CalculatorModel
     */
    private $model;
    function __construct(CalculatorModel $model)
    {
        $this->model = $model;
    }
    public function sumAction()
    {
        $action = 'doSum';
        require 'application/views/form.phtml';
    }
    public function doSumAction()
    {
        $this->model->setOp1($_POST['op1']);
        $this->model->setOp2($_POST['op2']);
        $this->model->sum();
        $result = $this->model->getResult();
        require 'application/views/result.phtml';
    }
    public function subtractAction()
    {
        $action = 'doSubtract';
        require 'application/views/form.phtml';
    }
    public function doSubtractAction()
    {
        $this->model->setOp1($_POST['op1']);
        $this->model->setOp2($_POST['op2']);
        $this->model->subtract();
        $result = $this->model->getResult();
        require 'application/views/result.phtml';
    }
    public function multiplyAction()
    {
        $action = 'doMultiply';
        require 'application/views/form.phtml';
    }
    public function doMultiplyAction()
    {
        $this->model->setOp1($_POST['op1']);
        $this->model->setOp2($_POST['op2']);
        $this->model->multiply();
        $result = $this->model->getResult();
        require 'application/views/result.phtml';
    }
    public function divideAction()
    {
        $action = 'doDivide';
        require 'application/views/form.phtml';
    }
    public function doDivideAction()
    {
        $this->model->setOp1($_POST['op1']);
        $this->model->setOp2($_POST['op2']);
        $this->model->divide();
        $result = $this->model->getResult();
        require 'application/views/result.phtml';
    }
}
{% endhighlight %}

So now the model or service instance is created only one time in our application and it is injected to whatever other object that needs it. That instance can be shared or a new one for every different object.

The code is available at GitHub: [Dependency Injection](https://github.com/itrascastro/MVC/tree/DependencyInjection)
