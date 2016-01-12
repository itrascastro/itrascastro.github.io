---
layout: post
title:  "Dot ini files parser class with extended section support"
description: "parse_ini_file wrapper to add extend support"
date:   2014-05-21 11:00:00 +0100
tags: [ ini file, sections inheritance, library ]
comments: true
author: itrascastro
---

When I developed [xenframework](http://www.xenframework.com) I had to create a component to enable developers to store configuration data in a familiar INI format and read them in the application by using nested object property syntax. The INI format is specialized to provide both the ability to have a hierarchy of configuration data keys and inheritance between configuration data sections. Configuration data hierarchies are supported by separating the keys with the dot or period character ("."). A section may extend or inherit from another section by following the section name with a colon character (":") and the name of the section from which data are to be inherited.

## Example of use

This example illustrates a basic use of the Ini component combined with the Config component for loading configuration data from an INI file. In this example there are configuration data for both a production system and for a development system. Because the development system configuration data are very similar to those for production, the development section inherits from the production section. In this case, the decision is arbitrary and could have been written conversely, with the production section inheriting from the development section, though this may not be the case for more complex situations. Suppose, then, that the following configuration data are contained in /path/to/config.ini:

{% highlight ini %}
; Production site configuration data
[production]
webhost                  = www.example.com
database.adapter         = pdo_mysql
database.params.host     = db.example.com
database.params.username = dbuser
database.params.password = secret
database.params.dbname   = dbname

; Development site configuration data inherits from production and
; overrides values as necessary
[development : production]
database.params.host     = dev.example.com
database.params.username = devuser
database.params.password = devsecret
{% endhighlight %}

Next, assume that the application developer needs the development configuration data from the INI file. It is a simple matter to load these data by specifying the INI file and the development section:

{% highlight php %}
<?php
$config = new Ini('/path/to/config.ini', 'development');

echo $config->database->params->host;   // prints "dev.example.com"
echo $config->database->params->dbname; // prints "dbname"
{% endhighlight %}

## The Ini class

Now we are going to see the code of the Ini class which is well documented:

{% highlight php %}
<?php
class Ini extends Config
{
    /**
     * __construct
     *
     * Creates the object representation of an .ini file section
     *
     * To do that:
     *
     *      1. Creates an array from .ini file using php defined function parse_ini_file
     *      2. Apply the sections inheritance
     *      3. Dotted properties are converted to array
     *      4. Selects the section from the array
     *      5. Creates the object for that section calling the parent constructor
     *
     * @param array     $file
     * @param string    $section
     */
    public function __construct($file, $section)
    {
        $array = parse_ini_file($file, true);
        $this->_applyExtends($array);
        $this->_convertDottedPropertiesToArray($array);
        $array = (array_key_exists($section, $array)) ? $array[$section] : array();
        parent::__construct($array);
    }
    /**
     * _applyExtends
     *
     * If a section inherits from another section, the inherited properties are copied from the parent
     *
     * For each section in the array
     *
     *      1. Gets the parents for that section
     *      2. For each parent
     *          2.1. Gets the parent array
     *          2.2. Copies the parent array values into this section
     *      3. The section name is changed removing the parents from it
     *
     * @param array $array
     */
    private function _applyExtends(&$array)
    {
        foreach ($array as $section => &$arraySection) {
            $extends = $this->_getExtends($section);
            foreach ($extends as $parent) {
                $parentArray = $this->_getParentArray($parent, $array);
                $this->_copySection($parentArray, $arraySection);
            }
            $this->_changeSectionName($array, $section);
        }
    }
    /**
     * _changeSectionName
     *
     * Removes parents from the section name
     *
     *      section3 : section2 : section 1     ===> section3
     *
     * If the section has parents then creates a new key in the array and unset the old
     *
     * @param array     $array
     * @param string    $section
     */
    private function _changeSectionName(&$array, $section)
    {
        $sectionName = explode(':', $section);
        if (sizeof($sectionName) > 1) {
            $newSectionName = trim($sectionName[0]);
            $array[$newSectionName] = $array[$section];
            unset($array[$section]);
        }
    }
    /**
     * _getParentArray
     *
     * Given a section name and an array, returns the sub array with that section name
     *
     * @param string $parent
     * @param array  $array
     *
     * @throws \Exception
     * @return array
     */
    private function _getParentArray($parent, $array)
    {
        foreach ($array as $section => $arraySection) {
            $sectionName = explode(':', $section);
            if (trim($sectionName[0]) == $parent) return $arraySection;
        }
        throw new \Exception('No section matches with ' . $parent);
    }
    /**
     * _getExtends
     *
     * Returns the parents for a given section
     *
     *      Removes the section from the section name and returns an array of the parents with the rest of the sections
     *
     * @param string $section
     *
     * @return array
     */
    private function _getExtends($section)
    {
        $sections = explode(':', $section);
        $extends = array_slice($sections, 1);
        $trimExtends = array_map('trim', $extends);
        return $trimExtends;
    }
    /**
     * _copySection
     *
     * Copies one section into another
     *
     *      If a key from source section does not exist in the target section, it is copied
     *
     * @param array $source
     * @param array $target
     */
    private function _copySection($source, &$target)
    {
        foreach ($source as $key => $value) {
            if (!array_key_exists($key, $target)) $target[$key] = $value;
        }
    }
    /**
     * _convertDottedPropertiesToArray
     *
     * For each property inside of each section:
     *
     *      1. Converts that dotted property into an array
     *      2. All the converted arrays in a section are merged
     *
     * @param array $array
     */
    private function _convertDottedPropertiesToArray(&$array)
    {
        foreach ($array as $section => $sectionArray) {
            $merged = array();
            foreach ($sectionArray as $key => $value) {
                $property = $this->_dotToArray($key, $value);
                $merged = array_merge_recursive($merged, $property);
            }
            $array[$section] = $merged;
        }
    }
    /**
     * _dotToArray
     *
     * Converts a dotted property into an array recursively
     *
     * This dotted property
     *
     *      'x.y.z' => $value
     *
     * will be converted into this array
     *
     *      array(
     *              'x' => array(
     *                      'y' => array(
     *                              'z' => $value
     *                   )
     *              )
     *      )
     *
     * @param string    $dottedKey
     * @param mixed     $value The value for that dotted key in the array
     *
     * @return array
     */
    private function _dotToArray($dottedKey, $value)
    {
        $property = explode('.', $dottedKey);
        if (sizeof($property) == 1) {
            return array($property[0] => $value);
        } else {
            return array($property[0] => $this->_dotToArray(implode('.', array_slice($property, 1)), $value));
        }
    }
}
{% endhighlight %}

where the Config class creates the object representation of the section array:

{% highlight php %}
<?php
class Config
{
    /**
     * __construct
     *
     * Recursively looks for arrays and coverts them into objects. If a key value is not an array then it will be
     * set as a property in the new object
     *
     * @param array $array The config array
     */
    public function __construct($array)
    {
        foreach($array as $key => $value)
        {
            $this->$key = (!is_array($value)) ? $value : new Config($value);
        }
    }
}
{% endhighlight %}
