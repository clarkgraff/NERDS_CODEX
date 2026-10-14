const fs=require('node:fs');
const path=require('node:path');
module.exports=async file=>{
 let xml=fs.readFileSync(file,'utf8');
 const notice=fs.readFileSync(path.join(__dirname,'../assets/license.rtf'),'utf8');
 xml=xml.replace('<Property Id="DISABLEADVTSHORTCUTS"', '<Property Id="ARPCOMMENTS" Value="Copyright (c) 2026 4nR TeK Inc. All rights reserved. Created by Clark Graff."/>\n    <Property Id="DISABLEADVTSHORTCUTS"');
 xml=xml.replace('Dialog="WelcomeDlg" Control="Next" Event="NewDialog" Value="InstallScopeDlg"','Dialog="WelcomeDlg" Control="Next" Event="NewDialog" Value="NerdsNoticeDlg"');
 xml=xml.replace('Dialog="InstallScopeDlg" Control="Back" Event="NewDialog" Value="WelcomeDlg"','Dialog="InstallScopeDlg" Control="Back" Event="NewDialog" Value="NerdsNoticeDlg"');
 xml=xml.replace('<UIRef Id="WixUI_InstallDir"/>',`<UIRef Id="WixUI_InstallDir"/>
 <UI><Dialog Id="NerdsNoticeDlg" Width="370" Height="270" Title="NERDS — Software information">
  <Control Id="Title" Type="Text" X="15" Y="10" Width="340" Height="20" Text="NERDS — 4nR TeK Inc."/>
  <Control Id="Notice" Type="ScrollableText" X="15" Y="35" Width="340" Height="190"><Text><![CDATA[${notice}]]></Text></Control>
  <Control Id="Back" Type="PushButton" X="180" Y="243" Width="56" Height="17" Text="Back"><Publish Event="NewDialog" Value="WelcomeDlg">1</Publish></Control>
  <Control Id="Next" Type="PushButton" X="236" Y="243" Width="56" Height="17" Default="yes" Text="Next"><Publish Event="NewDialog" Value="InstallScopeDlg">1</Publish></Control>
  <Control Id="Cancel" Type="PushButton" X="304" Y="243" Width="56" Height="17" Cancel="yes" Text="Cancel"><Publish Event="SpawnDialog" Value="CancelDlg">1</Publish></Control>
 </Dialog></UI>`);
 fs.writeFileSync(file,xml);
};
