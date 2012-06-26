<?php
//Copyright (c) 2012, Brian McCloskey. All rights reserved.
//For licensing, see LICENSE, or <http://www.gnu.org/licenses/>

// Disallow direct access to this file for security reasons
if (!defined("IN_MYBB"))
{
	die("Direct access to this file is not allowed.");
}

// Define hooks
$plugins->add_hook('usercp_options_end', 'ckeditor_quick_reply_option');
$plugins->add_hook('usercp_do_options_end', 'ckeditor_quick_reply_do_option');
$plugins->add_hook('showthread_start', 'ckeditor_add_onclick');
$plugins->add_hook('showthread_end', 'ckeditor_load');
$plugins->add_hook('newreply_end', 'ckeditor_load');
$plugins->add_hook('newthread_end', 'ckeditor_load');
$plugins->add_hook('editpost_end', 'ckeditor_load');
$plugins->add_hook('private_send_end', 'ckeditor_load');
$plugins->add_hook('modcp_new_announcement', 'ckeditor_load');
$plugins->add_hook('modcp_edit_announcement', 'ckeditor_load');
$plugins->add_hook('modcp_editprofile_end', 'ckeditor_load');
$plugins->add_hook('usercp_editsig_start', 'ckeditor_load');
$plugins->add_hook('admin_config_settings_change_commit', 'ckeditor_settings');

// Plugin information
function ckeditor_info()
{
	global $lang;

	$lang->load("ckeditor");

	return array (
		"name"			=> "CKEditor (WYSIWYG)",
		"description"	=> $lang->ckeditor_description,
		"website"		=> "",
		"author"		=> "Brian McCloskey",
		"authorsite"	=> "",
		"version"		=> "1.0.0",
		"guid"			=> "",
		"compatibility"	=> "16*",
	);
}

// Plugin install
function ckeditor_install()
{
	global $db, $lang;

	require_once(MYBB_ROOT."admin/inc/functions_themes.php");
	
	$lang->load("ckeditor");
	
	// Setting to allow users to enable/disable ckeditor on quick reply
	$db->query('ALTER TABLE '.TABLE_PREFIX.'users ADD ckeditorquickreply INT(1) DEFAULT 0 NOT NULL AFTER showquickreply');
	
	// Template for loading the ckeditor javascript
	$ckeditor_load_template = '<script type="text/javascript" src="{$mybb->settings[\'bburl\']}/jscripts/editor_themes/ckeditor/ckeditor.js"></script>';
	$ckeditor_load = array(
		'tid'			=> NULL,
		'title'			=> 'ckeditor_load',
		'template'		=> $db->escape_string($ckeditor_load_template),
		'sid'			=> '-1'
	);
	$db->insert_query('templates', $ckeditor_load);

	// Template for defining a ckeditor instance
	$ckeditor_instance_template = '<script type="text/javascript">CKEDITOR.replace(\'message\', {customConfig : \'mybb_config.js\', ckeditorImageWidth : \'{$ckeditor_image_width}\', contentsCss : \'{$mybb->settings[\'bburl\']}/cache/themes/{$ck_theme_dir}/ckeditor.css\'})</script>';
	$ckeditor_instance = array(
		'tid'			=> NULL,
		'title'			=> 'ckeditor_instance',
		'template'		=> $db->escape_string($ckeditor_instance_template),
		'sid'			=> '-1'
	);
	$db->insert_query('templates', $ckeditor_instance);
	
	// Default stylesheet added to Master Template for skinning CKEditor content.
	$ckeditor_stylesheet_template = @file_get_contents(MYBB_ROOT.'inc/plugins/ckeditor/ckeditor.css');
	$ckeditor_stylesheet = array(
		'sid'			=> NULL,
		'name'			=> 'ckeditor.css',
		'tid'			=> '1',
		'attachedto'	=> 'nothing',
		'stylesheet'	=> $db->escape_string($ckeditor_stylesheet_template),
		'cachefile'		=> 'ckeditor.css',
		'lastmodified'	=> TIME_NOW,
	);
	$db->insert_query('themestylesheets', $ckeditor_stylesheet);
	cache_stylesheet(1, "ckeditor.css", $ckeditor_stylesheet_template);
	
	// Create setting group for ckeditor
	$ckeditor_settings_group = array(
		'gid'			=> 'NULL',
		'name'			=> 'ckeditor_settings',
		'title'			=> $lang->ckeditor_group_title,
		'description'	=> $lang->ckeditor_group_description,
		'disporder'		=> "99",
		'isdefault'		=> '0',
	);
	$db->insert_query('settinggroups', $ckeditor_settings_group);
	$ckeditor_gid = $db->insert_id();
	
	// Add global configuration setting for Posts
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_posts',
		'title'			=> $lang->ckeditor_posts_title,
		'description'	=> $lang->ckeditor_posts_description,
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add global configuration setting for PMs
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_pm',
		'title'			=> $lang->ckeditor_pm_title,
		'description'	=> $lang->ckeditor_pm_description,
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '2',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add global configuration setting for MODCP
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_modcp',
		'title'			=> $lang->ckeditor_modcp_title,
		'description'	=> $lang->ckeditor_modcp_description,
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '3',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add global configuration setting for Signatures
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_sig',
		'title'			=> $lang->ckeditor_sig_title,
		'description'	=> $lang->ckeditor_sig_description,
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '4',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);

	// Add global configuration setting for Quick Reply
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_quickreply',
		'title'			=> $lang->ckeditor_quickreply_title,
		'description'	=> $lang->ckeditor_quickreply_description,
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '5',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);

	// Add max image width
	$ckeditor_setting = array(
		'gid'			=> $ckeditor_gid,
		'name'			=> 'ckeditor_image_width',
		'title'			=> $lang->ckeditor_image_width_title,
		'description'	=> $lang->ckeditor_image_width_description,
		'optionscode'	=> 'text',
		'value'			=> '200',
		'disporder'		=> '6',
		'isdefault'		=> '1',
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add hidden field for Thread/Posts state change
	$ckeditor_setting = array(
		'gid'			=> '0',
		'name'			=> 'ckeditor_hidden_posts',
		'title'			=> '',
		'description'	=> '',
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1'
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add hidden field for Private Message state change
	$ckeditor_setting = array(
		'gid'			=> '0',
		'name'			=> 'ckeditor_hidden_pm',
		'title'			=> '',
		'description'	=> '',
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1'
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add hidden field for Moderator CP state change
	$ckeditor_setting = array(
		'gid'			=> '0',
		'name'			=> 'ckeditor_hidden_modcp',
		'title'			=> '',
		'description'	=> '',
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1'
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add hidden field for Signature state change
	$ckeditor_setting = array(
		'gid'			=> '0',
		'name'			=> 'ckeditor_hidden_sig',
		'title'			=> '',
		'description'	=> '',
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1'
	);
	$db->insert_query('settings', $ckeditor_setting);
	
	// Add hidden field for Quick Reply state change
	$ckeditor_setting = array(
		'gid'			=> '0',
		'name'			=> 'ckeditor_hidden_quickreply',
		'title'			=> '',
		'description'	=> '',
		'optionscode'	=> 'yesno',
		'value'			=> '1',
		'disporder'		=> '1',
		'isdefault'		=> '1'
	);
	$db->insert_query('settings', $ckeditor_setting);

	rebuild_settings();
	update_theme_stylesheet_list("1");
}

// Plugin uninstall
function ckeditor_uninstall()
{
	global $db;
	
	require_once(MYBB_ROOT."admin/inc/functions_themes.php");
	
	$db->query('ALTER TABLE '.TABLE_PREFIX.'users DROP ckeditorquickreply');
	$db->query('DELETE FROM '.TABLE_PREFIX.'templates WHERE title=\'ckeditor_load\'');
	$db->query('DELETE FROM '.TABLE_PREFIX.'templates WHERE title=\'ckeditor_instance\'');
	$db->query('DELETE FROM '.TABLE_PREFIX.'themestylesheets WHERE name=\'ckeditor.css\'');
	$db->query('DELETE FROM '.TABLE_PREFIX.'settinggroups WHERE name=\'ckeditor_settings\'');
	$db->query('DELETE FROM '.TABLE_PREFIX.'settings WHERE name LIKE \'ckeditor_%\'');
	
	$query = $db->simple_select("themes", "tid");

	while($tid = $db->fetch_field($query, "tid"))
	{
		$css_file = MYBB_ROOT."cache/themes/theme{$tid}/ckeditor.css";
		if(file_exists($css_file))
			unlink($css_file);
	}
		
	update_theme_stylesheet_list("1");
}

// Plugin is_installed
function ckeditor_is_installed()
{
	global $db;
	
	if($db->field_exists('ckeditorquickreply', 'users'))
		return true;
	
	return false;
}

// Plugin activate
function ckeditor_activate()
{
	global $db, $mybb;

	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('usercp_options', "#".preg_quote('{$pppselect}')."#", '{$ckeditor_quick_reply}{$pppselect}');
	
	if($mybb->settings['ckeditor_posts'] == 1)
		ckeditor_enable_posts();
	
	if($mybb->settings['ckeditor_pm'] == 1)
		ckeditor_enable_pm();
	
	if($mybb->settings['ckeditor_modcp'] == 1)
		ckeditor_enable_modcp();
	
	if($mybb->settings['ckeditor_sig'] == 1)
		ckeditor_enable_sig();
	
	if($mybb->settings['ckeditor_quickreply'] == 1)
		ckeditor_enable_quickreply();
}

// Plugin deactivate
function ckeditor_deactivate()
{
	global $db, $mybb;
	
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('usercp_options', "#".preg_quote('{$ckeditor_quick_reply}{$pppselect}')."#", '{$pppselect}');
	
	ckeditor_disable_posts();
	ckeditor_disable_pm();
	ckeditor_disable_modcp();
	ckeditor_disable_sig();
	ckeditor_disable_quickreply();
}

// Add profile option to enable ckeditor for quick reply box.
function ckeditor_quick_reply_option()
{
	global $db, $mybb, $ckeditor_quick_reply, $lang;
	
	if($mybb->settings['ckeditor_quickreply'] == 1)
	{
		$lang->load("ckeditor");
		
		$checked = "";
		
		$query = $db->simple_select("users", "*", "username='".$mybb->user['username']."'");
		$result = $db->fetch_field($query, 'ckeditorquickreply');
		
		if($result)
			$checked = "checked=\"checked\"";
		
		$ckeditor_quick_reply = '<td valign="top" width="1"><input type="checkbox" class="checkbox" name="ckeditorquickreply" id="ckeditorquickreply" value="1" '.$checked.' /></td>
			<td><span class="smalltext"><label for="ckeditorquickreply">'.$lang->ckeditor_profile_description.'</label></span></td></tr>';
	}
}

// Alter quick reply box option for the user on submit.
function ckeditor_quick_reply_do_option()
{
	global $mybb, $db;
	
	if($mybb->settings['ckeditor_quickreply'] == 1)
	{
		if($mybb->input['ckeditorquickreply'] == 1) {
			$db->query('UPDATE '.TABLE_PREFIX.'users SET ckeditorquickreply=\'1\' WHERE username=\''.$mybb->user['username'].'\'');
		} else {
			$db->query('UPDATE '.TABLE_PREFIX.'users SET ckeditorquickreply=\'0\' WHERE username=\''.$mybb->user['username'].'\'');
		}
	}
}

function ckeditor_add_onclick()
{
	global $mybb, $ckeditor_onclick;

	if(THIS_SCRIPT == "showthread.php" && ($mybb->settings['ckeditor_quickreply'] == 1) &&
		($mybb->user['ckeditorquickreply'] == 1))
		$ckeditor_onclick = 'onclick="CKEDITOR.instances[\'message\'].updateElement();CKEDITOR.instances[\'message\'].setData(\'\');"';
}

// Load ckeditor
function ckeditor_load()
{
	global $ckeditor_load, $ckeditor_instance, $templates, $theme, $mybb, $cache, $quickreply;
	
	// Build smiley information from the cache
	$smilies = $cache->read('smilies');
	foreach($smilies as $smiley) {
		if($smiley['showclickable'] == 1) {
			$smiley_description = $smiley_description . "'{$smiley['name']}',";
			$smiley_path = $smiley_path . "'{$smiley['image']}',";
			$smiley_name = $smiley_name . "'{$smiley['find']}',";
		}
	}
	$smiley_description = substr($smiley_description, 0, strlen($smiley_description)-1);
	$smiley_path = substr($smiley_path, 0, strlen($smiley_path)-1);
	$smiley_name = substr($smiley_name, 0, strlen($smiley_name)-1);

	// Determine which CSS file to use and load the templates
	if(file_exists(MYBB_ROOT."cache/themes/theme{$theme['tid']}/ckeditor.css"))
		$ck_theme_dir = "theme{$theme['tid']}";
	else
		$ck_theme_dir = "theme1";

	if($mybb->settings['ckeditor_image_width'] > 0)
		$ckeditor_image_width = preg_replace('/[^0-9]/Uis', '', $mybb->settings['ckeditor_image_width']);
	else
		$ckeditor_image_width = 0;
	
	eval("\$ckeditor_instance = \"".$templates->get('ckeditor_instance')."\";");
	eval("\$ckeditor_load = \"".$templates->get('ckeditor_load')."\";");

	$url = parse_url( $mybb->settings['bburl'], PHP_URL_PATH) . '/';
	$replace = "ckeditor.css', smiley_descriptions : [ $smiley_description ], smiley_images : [ $smiley_path ], smiley_names : [ $smiley_name ], smiley_path : '".$url."'}";
	$ckeditor_instance = preg_replace("/ckeditor.css'}/", $replace, $ckeditor_instance);

	// If editing the sig, need to change the CKEditor instance
	if((THIS_SCRIPT == "usercp.php" && $mybb->input['action'] == "editsig") ||
		(THIS_SCRIPT == "modcp.php" && $mybb->input['action'] == "editprofile"))
	{
		$ckeditor_instance = preg_replace( '/message/', 'signature', $ckeditor_instance);
	}
	// If quick reply enabled, add the CKEditor instance
	else if(THIS_SCRIPT == "showthread.php" && ($mybb->settings['ckeditor_quickreply'] == 1) &&
		($mybb->user['ckeditorquickreply'] == 1))
	{
		$replace = "</textarea>{$ckeditor_instance}";
		$quickreply = preg_replace("#</textarea>#", $replace, $quickreply);
	}
}

// Evaluate setting changes
function ckeditor_settings()
{
	global $db, $mybb;

	if($mybb->settings['ckeditor_hidden_posts'] != $mybb->settings['ckeditor_posts'])
	{
		if($mybb->settings['ckeditor_posts'] == 0)
			ckeditor_disable_posts();
		else
			ckeditor_enable_posts();
		
		$db->query('UPDATE '.TABLE_PREFIX.'settings SET value=\''.$mybb->settings['ckeditor_posts'].'\' WHERE name=\'ckeditor_hidden_posts\'');
	}
	
	if($mybb->settings['ckeditor_hidden_pm'] != $mybb->settings['ckeditor_pm'])
	{
		if($mybb->settings['ckeditor_pm'] == 0)
			ckeditor_disable_pm();
		else
			ckeditor_enable_pm();
		
		$db->query('UPDATE '.TABLE_PREFIX.'settings SET value=\''.$mybb->settings['ckeditor_pm'].'\' WHERE name=\'ckeditor_hidden_pm\'');
	}
	
	if($mybb->settings['ckeditor_hidden_modcp'] != $mybb->settings['ckeditor_modcp'])
	{
		if($mybb->settings['ckeditor_modcp'] == 0)
			ckeditor_disable_modcp();
		else
			ckeditor_enable_modcp();
		
		$db->query('UPDATE '.TABLE_PREFIX.'settings SET value=\''.$mybb->settings['ckeditor_modcp'].'\' WHERE name=\'ckeditor_hidden_modcp\'');
	}
	
	if($mybb->settings['ckeditor_hidden_sig'] != $mybb->settings['ckeditor_sig'])
	{
		if($mybb->settings['ckeditor_sig'] == 0)
			ckeditor_disable_sig();
		else
			ckeditor_enable_sig();
		
		$db->query('UPDATE '.TABLE_PREFIX.'settings SET value=\''.$mybb->settings['ckeditor_sig'].'\' WHERE name=\'ckeditor_hidden_sig\'');
	}
}

// Enable CKEditor for Threads and Posts
function ckeditor_enable_posts()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('newreply', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('newreply', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('newreply', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
	find_replace_templatesets('newthread', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('newthread', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('newthread', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
	find_replace_templatesets('editpost', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('editpost', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('editpost', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
}

// Disable CKEditor for Threads and Posts
function ckeditor_disable_posts()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('newreply', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('newreply', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('newreply', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
	find_replace_templatesets('newthread', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('newthread', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('newthread', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
	find_replace_templatesets('editpost', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('editpost', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('editpost', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
}

// Enable CKEditor for Prviate Messaging
function ckeditor_enable_pm()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('private_send', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('private_send', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('private_send', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
}

// Disable CKEditor for Private Messaging
function ckeditor_disable_pm()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('private_send', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('private_send', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('private_send', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
}

// Enable CKEditor for Moderator CP
function ckeditor_enable_modcp()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
	find_replace_templatesets('modcp_editprofile', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('modcp_editprofile', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
}

// Disable CKEditor for Moderator CP
function ckeditor_disable_modcp()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('modcp_announcements_new', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('modcp_announcements_edit', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
	find_replace_templatesets('modcp_editprofile', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('modcp_editprofile', "#".preg_quote('{$ckeditor_load}')."#", '');
}

// Enable CKEditor for Signatures
function ckeditor_enable_sig()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('usercp_editsig', "#".preg_quote('{$codebuttons}')."#", '{$ckeditor_instance}');
	find_replace_templatesets('usercp_editsig', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('usercp_editsig', "#".preg_quote('{$smilieinserter}')."#", '{$_smilieinserter}');
}

// Disable CKeditor for Signatures
function ckeditor_disable_sig()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('usercp_editsig', "#".preg_quote('{$ckeditor_instance}')."#", '{$codebuttons}');
	find_replace_templatesets('usercp_editsig', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('usercp_editsig', "#".preg_quote('{$_smilieinserter}')."#", '{$smilieinserter}');
}

// Enable CKEditor for Quick Reply
function ckeditor_enable_quickreply()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");
	
	find_replace_templatesets('showthread', "#".preg_quote('</head>')."#", '{$ckeditor_load}</head>');
	find_replace_templatesets('showthread_quickreply', "#".preg_quote('id="quick_reply_submit"')."#", 'id="quick_reply_submit" {$ckeditor_onclick}');
}

// Disable CKEditor for Quick Reply
function ckeditor_disable_quickreply()
{
	require_once(MYBB_ROOT."inc/adminfunctions_templates.php");

	find_replace_templatesets('showthread', "#".preg_quote('{$ckeditor_load}')."#", '');
	find_replace_templatesets('showthread_quickreply', "#".preg_quote(' {$ckeditor_onclick}')."#", '');
}

?>