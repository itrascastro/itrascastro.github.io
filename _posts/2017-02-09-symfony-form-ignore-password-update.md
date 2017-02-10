---
layout: post
title:  "Symfony Form - Ignoring fields - Validation groups - Doctrine Events"
description: "Ignoring fields on different actions like Password Field on Create and Update actions"
date:   2017-02-09 08:00:00 +0100
tags: [ symfony, form, doctrine, events, validation groups ]
comments: true
author: itrascastro
---

In this situation we need to create a form for adding new users to our application. The entity has the typical fields (name, surname, username, password, ...). If we want to share the same form for the create and edit actions, we need the password field only to be mandatory if we are creating the user and not if we are updating him.

The solution I have adopted is having a validation group in the User entity to know when the password must be taken in account. Only the plainPassword field will belong to that group.

Assigning the validation group to the form will be done dynamically, testing if the plainPassword is empty or not.

We also must set as not required the password field in case we are updating.

Finally we have to encode the password only if it is not empty. For that we have to use the preUpdate Doctrine Event. But that event is not triggered because plainPassword is not a field watched from Doctrine. So we have to trigger it manually from the controller.

## The User entity

We set here the validation group for the plainPassword field.

{% highlight php %}
<?php

    /**
     * @var string
     *
     * This field will not be persisted
     * It is used to store the password in the form
     *
     * @Assert\NotBlank(message="Password cannot be empty", groups={"Update"})
     * @Assert\Regex(
     *      pattern="/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/",
     *      message="Password Error: Use 1 upper case letter, 1 lower case letter, and 1 number",
     *      groups={"Update"}
     * )
     */
    private $plainPassword;
{% endhighlight %}

## The Form Class

We add a new option to our form named 'update' to decide from the controller whenever the password field will be required (only on create action).

Using the configureOptions method we set the validation groups to the form, depending on the plainPassword value. Default if the plainPassword is empty so we do not take the plainPassword validation in account.

Before we set de validation_groups we need to know if it is an update form:

{% highlight php %}
<?php
$data->getPlainPassword() == '' && $form->getConfig()->getOption('update')
{% endhighlight %}

{% highlight php %}
<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TimeType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use AppBundle\Entity\User;

class UserType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('username')
            ->add('forename')
            ->add('surname')
            ->add('isActive', null, ['required' => false])
            ->add('isAdmin', CheckboxType::class, ['required' => false])
            ->add('plainPassword', null, ['required' => !$options['update']])
            ->add('newUserBtn', SubmitType::class, ['label' => $options['submitLabel'], 'attr' => ['class' => 'btn btn-lg btn-success btn-block']])
        ;

    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(
            [
                'data_class'            => 'AppBundle\Entity\User',
                'update'                => false,
                'submitLabel'           => 'New user',
                'validation_groups'     => function (FormInterface $form) {
                    $data = $form->getData();

                    if ($data->getPlainPassword() == '' && $form->getConfig()->getOption('update')) {
                        return ['Default'];
                    }

                    return ['Default', 'Update'];
                },
            ]
        );
    }

    public function getName()
    {
        return 'app_bundle_user_type';
    }
}
{% endhighlight %}

## The Service

We need now to associate a listener to doctrine preUpdate event. This is done in app/config/servives.yml

From the Doctrine Documentation:

prePersist - The prePersist event occurs for a given entity before the respective EntityManager persist operation for that entity is executed. It should be noted that this event is only triggered on initial persist of an entity (i.e. it does not trigger on future updates).

That is the reason because we need preUpdate event.

{% highlight yml %}
parameters:

services:
    app.doctrine.userListener:
        class: AppBundle\Doctrine\UserListener
        arguments: ["@security.encoder_factory"]
        tags:
            - { name: doctrine.event_listener, event: prePersist }
            - { name: doctrine.event_listener, event: preUpdate }
{% endhighlight %}

## The Listener

{% highlight php %}
<?php
namespace AppBundle\Doctrine;


use AppBundle\Entity\User;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Symfony\Component\Security\Core\Encoder\EncoderFactory;

class UserListener
{
    /**
     * @var EncoderFactory
     */
    private $encoderFactory;

    /**
     * UserListener constructor.
     */
    public function __construct(EncoderFactory $encoderFactory)
    {
        $this->encoderFactory = $encoderFactory;
    }

    public function prePersist(LifecycleEventArgs $eventArgs)
    {
        $this->handleEvent($eventArgs);
    }

    public function preUpdate(LifecycleEventArgs $eventArgs)
    {
        $this->handleEvent($eventArgs);
    }

    private function handleEvent(LifecycleEventArgs $eventArgs)
    {
        $user = $eventArgs->getEntity();

        if ($user instanceof User) {
            $encoder = $this->encoderFactory->getEncoder($user);
            $plainPassword = $user->getPlainPassword();

            if (!is_null($plainPassword)) {
                $password = $encoder->encodePassword($plainPassword, $user->getSalt());
                $user->setPassword($password);
            }
        }
    }
}
{% endhighlight %}

## The controller

As an update does only occur if a entity field (watched from doctrine) gets changed and so on the preupdate method is only called after a change.

PlainPassword is not a field watched from Doctrine. So we have to trigger preUpdate manually.

We also create the form setting the 'update' option to true for having the required parameter of the plainPassword field setted to false when updating.

{% highlight php %}
<?php

/**
 * @Route("/create", name="app_admin_user_create")
 */
public function createAction()
{
    $user = new User();
    $form = $this->createForm(UserType::class, $user);

    return $this->render(':admin/user:form.html.twig',
        [
            'form'      => $form->createView(),
            'action'    => $this->generateUrl('app_admin_user_doCreate'),
            'title'     => 'New user',
        ]
    );
}

/**
 * @Route("/do-create", name="app_admin_user_doCreate")
 */
public function doCreateAction(Request $request)
{
    $user = new User();
    $form = $this->createForm(UserType::class, $user);

    $form->handleRequest($request);

    if ($form->isValid()) {
        if ($user->getIsAdmin()) {
            $user->setRoles(['ROLE_ADMIN']);
        }

        $em = $this->getDoctrine()->getManager();

        $em->persist($user);
        $em->flush();

        return $this->redirectToRoute('app_admin_user_create');
    }

    return $this->render(':admin/user:form.html.twig',
        [
            'form'      => $form->createView(),
            'action'    => $this->generateUrl('app_admin_user_doCreate'),
            'title'     => 'New user',
        ]
    );
}

/**
 * @Route("/edit/{id}", name="app_admin_user_edit")
 */
public function editAction(User $user)
{
    $user->setIsAdmin($user->hasRole('ROLE_ADMIN'));
    $form = $this->createForm(UserType::class, $user, ['update' => true, 'submitLabel' => 'Update user']);

    return $this->render(':admin/user:form.html.twig',
        [
            'form'      => $form->createView(),
            'action'    => $this->generateUrl('app_admin_user_doEdit', ['id' => $user->getId()]),
            'title'     => 'Edit user',
        ]
    );
}

/**
 * @Route("/do-edit/{id}", name="app_admin_user_doEdit")
 * @param Request $request
 * @Method({"POST"})
 * @return \Symfony\Component\HttpFoundation\Response
 */
public function doEditAction(Request $request, User $user)
{
    $form = $this->createForm(UserType::class, $user, ['update' => true, 'submitLabel' => 'Update user']);

    $form->handleRequest($request);

    if ($form->isValid()) {
        if ($user->getIsAdmin()) {
            $user->setRoles(['ROLE_ADMIN']);
        } else {
            $user->setRoles(['ROLE_USER']);
        }

        $em = $this->getDoctrine()->getManager();

        // PlainPassword is not a field watched from Doctrine. So we have to trigger preUpdate manually
        $eventManager = $em->getEventManager();
        $eventArgs = new LifecycleEventArgs($user, $em);
        $eventManager->dispatchEvent(\Doctrine\ORM\Events::preUpdate, $eventArgs);

        $em = $this->getDoctrine()->getManager();
        $em->persist($user);
        $em->flush();

        return $this->redirectToRoute('app_admin_user_index');
    }

    return $this->render(':admin/user:form.html.twig',
        [
            'form'      => $form->createView(),
            'action'    => $this->generateUrl('app_admin_user_doEdit', ['id' => $user->getId()]),
            'title'     => 'Edit user',
        ]
    );
}
{% endhighlight %}
