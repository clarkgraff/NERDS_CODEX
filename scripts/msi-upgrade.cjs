'use strict';
// A single stable upgrade family plus explicit removal of the prior 0.4.0 family.
// Windows Installer owns rollback and obsolete component removal; USER data is
// outside the MSI component table and is never deleted by this hook.
module.exports=xml=>{
 xml=xml.replace('<MajorUpgrade ', '<MajorUpgrade Schedule="afterInstallInitialize" ');
 const addition=`
 <Upgrade Id="6887152D-FF22-5932-8F57-5DB09718D261"><UpgradeVersion Minimum="0.4.0" Maximum="0.4.2" IncludeMinimum="yes" IncludeMaximum="no" OnlyDetect="no" Property="NERDS_LEGACY_PRODUCTS"/></Upgrade>
 <Property Id="NERDS_LEGACY041DIR"><ComponentSearch Id="FindLegacy041" Guid="955BBA2A-6709-55D9-8C22-AB10F4F8BC05" Type="directory"/></Property>
 <Property Id="NERDS_LEGACY040DIR"><ComponentSearch Id="FindLegacy040" Guid="DEBAB571-7ABF-53B0-95B1-A78173C4D194" Type="directory"/></Property>
 <SetProperty Id="APPLICATIONFOLDER" Action="UseLegacy041Directory" Value="[NERDS_LEGACY041DIR]" After="AppSearch">NOT APPLICATIONFOLDER AND NERDS_LEGACY041DIR</SetProperty>
 <SetProperty Id="APPLICATIONFOLDER" Action="UseLegacy040Directory" Value="[NERDS_LEGACY040DIR]" After="UseLegacy041Directory">NOT APPLICATIONFOLDER AND NERDS_LEGACY040DIR</SetProperty>
 <SetProperty Id="ARPINSTALLLOCATION" Value="[APPLICATIONFOLDER]" After="CostFinalize"/>
 <CustomAction Id="NerdsRollbackTest" Error="Intentional NERDS installer rollback verification."/>
 <InstallExecuteSequence><Custom Action="NerdsRollbackTest" After="InstallFiles">NERDS_TEST_FAIL = 1</Custom></InstallExecuteSequence>
 `;
 return xml.replace('<MediaTemplate ',addition+'\n <MediaTemplate ');
};
