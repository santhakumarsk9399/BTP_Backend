// controllers/businessRequestController.js
const businessRequestModel = require('../Models/businessRequestModel');
const { sendEmail } = require('../Utility/emailHelper');
const { encryptData, decryptData } = require("../Utility/crypto");
exports.gridData = async (req, res) => {
    const { empname, designation } = req.query;

    // Username Empty Validation
    if (!empname || empname.trim() === '') {
        return res.status(400).json({success:false,message: 'Employee Name is required' });
    }

    // Password Empty Validation
    if (!designation || designation.trim() === '') {
        return res.status(400).json({success:false,message: 'Designation is required' });
    }
    
    const data = await businessRequestModel.gridData({empname:empname});
    if(designation == 'Manager'){
        return res.json({ success:true,pending:data[0],approved:data[2],waitingForApproval:data[1],approvedRequest:data[3],superiorApprovedRequest:data[4], financeWaitingForApproval:data[5],ceoWaitingForApproval:data[6],internationalApproved:data[7]});
    }    
    return res.json({ success:true,pending:data[0],approved:data[2]});
};

exports.ticketID = async (req, res) => { 
    const ticketID = await businessRequestModel.ticketID(); 
    const formatTravelId = (num) => `TID_${num.toString().padStart(4, '0')}`;  
    return res.status(200).json({ success:true,message:'Business Travel Request New Ticket ID.',ticketID:formatTravelId(ticketID.CurrentIdentityValue)});
};

exports.employees = async (req, res) => { 
	const {empname} = req.query;
    const employees = await businessRequestModel.employees(empname); 
    return res.status(200).json({ success:true,message:'List of Employees',employees:employees[0]});
};

exports.employeeteam = async (req, res) => {
    const {empname} = req.query; 
    const employeeteam = await businessRequestModel.employeeteam(empname); 
    return res.status(200).json({success:true,message:'List of Team members',employees:employeeteam[0]});
};

exports.create = async (req, res) => {
    const {
        empname,
        emptype,
        typeofvisit,
        purpose,
        currency_type,
        top_up_amount,
        advance_cash,
        is_group,
        created_date,
		ModeOfTravel,
        selectedempids = [],
        selectedprojectids = [],
        accomdations = []
    } = req.body;

    try {
        // Validation
        if (!empname?.trim()) {
            return res.status(400).json({ success: false, message: 'Employee name is required' });
        }
		
		const mot = (ModeOfTravel == 1) ? "Air" : (ModeOfTravel == 2) ? "Train" : (ModeOfTravel == 3) ? "Bus" : "Taxi/Cab";
		console.log({
            empname,
            emptype,
            typeofvisit,
            purpose,
            currency_type,
            top_up_amount,
            advance_cash,
            is_group,
			mot,
            created_date
        });
        // Step 1: Create main business request
        const mainData = await businessRequestModel.create({
            empname,
            emptype,
            typeofvisit,
            purpose,
            currency_type,
            top_up_amount,
            advance_cash,
            is_group,
			mot,
            created_date
        });

        const travelId = mainData.Travel_id;
        if (!travelId) {
            return res.status(500).json({ success: false, message: 'Failed to generate travel ID.' });
        }

        // Step 2: Get creator employee ID
        const createdBy = await businessRequestModel.createdBy(empname);
        if (!createdBy?.Emp_id) {
            throw new Error(`Creator not found for empname: ${empname}`);
        }

        // Step 3: Insert selected employees
        if (Array.isArray(selectedempids) && selectedempids.length > 0) {
            await Promise.all(
                selectedempids.map(async (emp) => {
                    const empData = await businessRequestModel.createdBy(emp.empname);
                    if (empData?.Emp_id) {
                        return businessRequestModel.selectedemployeeids({
                            empids: empData.Emp_id,
                            emp_id: createdBy.Emp_id,
                            travel_id: travelId
                        });
                    }
                })
            );
        }else{
            await businessRequestModel.selectedemployeeids({
                            empids: 0,
                            emp_id: createdBy.Emp_id,
                            travel_id: travelId
                        });
        }

        // Step 4: Insert selected projects
        if (Array.isArray(selectedprojectids) && selectedprojectids.length > 0) {
            await Promise.all(
                selectedprojectids.map((proj) =>
                    businessRequestModel.selectedprojectids({
                        ...proj,
                        travel_id: travelId
                    })
                )
            );
        }

        // Step 5: Insert accommodations
        if (Array.isArray(accomdations) && accomdations.length > 0) {
            await Promise.all(
                accomdations.map((acc) =>
                    businessRequestModel.accomdations({
                        ...acc,
                        travel_id: travelId
                    })
                )
            );
        }
		await createEmail(travelId);
        // Step 6: Respond to client
        return res.json({
            success: true,
            message: 'Business Travel Request created successfully.',
            travel_id: travelId
        });
		

    } catch (error) {
        console.error('Error creating travel request:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the travel request.',
            error: error.message
        });
    }
};

async function createEmail(travel_id) {
	try{
		const subject = 'BTP Portal - Request Created';
		const formatTravelId = (num) => `TID_${num.toString().padStart(4, '0')}`;
		const htmlContent = `
			<p>Dear Employee,</p>
			<p>Your Business Travel Plan submitted successfully ${formatTravelId(travel_id)}.</p>
			<p>Thank you,</p>
			<p>BTP 1.0</p>
			<p><a href="http://www.delopt.co.in">www.delopt.co.in</a></p>
		`;
		//Employee Email
		const empEmail = await businessRequestModel.getEmpEmail(travel_id);
		const mgrEmail = await businessRequestModel.getManagerEmail(travel_id);
		const selectedEmpEmail = await businessRequestModel.getSelectedEmpEmail(travel_id);

		if (!empEmail) {
			console.log('No email found');
			return;
		}
		//Employee Email
		await sendEmail(empEmail[0].emailid, subject, htmlContent, 0);
		await sendEmail(mgrEmail[0].emailid, subject, htmlContent, 0);
		if(selectedEmpEmail[0].emailid != 'No Email Found'){
			await sendEmail(selectedEmpEmail[0].emailid, subject, htmlContent, 0);
		}
	} catch (error) {
        console.error(`Failed to send new email to ${empEmail[0].emailid}:`, error);
    }
}


exports.edit = async (req, res) => {
    const {
        travel_id,
        empname,
        emptype,
        typeofvisit,
        purpose,
        currency_type,
        top_up_amount,
        advance_cash,
        is_group,
		ModeOfTravel,
        selectedempids = [],
        selectedprojectids = [],
        accomdations = []
    } = req.body;

    try {
        // Validation
        if (!empname?.trim()) {
            return res.status(400).json({ success: false, message: 'Employee name is required' });
        }
		const mot = (ModeOfTravel == 1) ? "Air" : (ModeOfTravel == 2) ? "Train" : (ModeOfTravel == 3) ? "Bus" : "Taxi/Cab";
        // Step 1: Create main business request
        const mainData = await businessRequestModel.edit({
            travel_id,
            empname,
            emptype,
            typeofvisit,
            purpose,
            currency_type,
            top_up_amount,
            advance_cash,
			mot,
            is_group
        });        

        // Step 2: Get creator employee ID
        const createdBy = await businessRequestModel.createdBy(empname);
        if (!createdBy?.Emp_id) {
            throw new Error(`Creator not found for empname: ${empname}`);
        }

        // Step 3: Insert selected employees
        if (Array.isArray(selectedempids) && selectedempids.length > 0) {
            await Promise.all(
                selectedempids.map(async (emp) => {
                    const empData = await businessRequestModel.createdBy(emp.empname);
                    if (empData?.Emp_id) {
                        return businessRequestModel.selectedemployeeids({
                            empids: empData.Emp_id,
                            emp_id: createdBy.Emp_id,
                            travel_id: travel_id
                        });
                    }
                })
            );
        }else{
            await businessRequestModel.selectedemployeeids({
                            empids: 0,
                            emp_id: createdBy.Emp_id,
                            travel_id: travel_id
                        });
        }

        // Step 4: Insert selected projects
        if (Array.isArray(selectedprojectids) && selectedprojectids.length > 0) {
            await Promise.all(
                selectedprojectids.map((proj) =>
                    businessRequestModel.selectedprojectids({
                        ...proj,
                        travel_id: travel_id
                    })
                )
            );
        }

        // Step 5: Insert accommodations
        if (Array.isArray(accomdations) && accomdations.length > 0) {
            await Promise.all(
                accomdations.map((acc) =>
                    businessRequestModel.accomdations({
                        ...acc,
                        travel_id: travel_id
                    })
                )
            );
        }
		editEmail(travel_id);
        // Step 6: Respond to client
        return res.json({
            success: true,
            message: 'Business Travel Request updated successfully.',
        });

    } catch (error) {
        console.error('Error creating travel request:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the travel request.',
            error: error.message
        });
    }
};

async function editEmail(travel_id) {
	try{
		const subject = 'BTP Portal - Request Updated.';
		const formatTravelId = (num) => `TID_${num.toString().padStart(4, '0')}`;
		const htmlContent = `
			<p>Dear Employee,</p>
			<p>Your Business Travel Plan updated successfully ${formatTravelId(travel_id)}.</p>
			<p>Thank you,</p>
			<p>BTP 1.0</p>
			<p><a href="http://www.delopt.co.in">www.delopt.co.in</a></p>
		`;
		//Employee Email
		const empEmail = await businessRequestModel.getEmpEmail(travel_id);
		const mgrEmail = await businessRequestModel.getManagerEmail(travel_id);
		const selectedEmpEmail = await businessRequestModel.getSelectedEmpEmail(travel_id);

		if (!empEmail) {
			console.log('No email found');
			return;
		}
		//Employee Email
		await sendEmail(empEmail[0].emailid, subject, htmlContent, 0);
		await sendEmail(mgrEmail[0].emailid, subject, htmlContent, 0);
		if(selectedEmpEmail[0].emailid != 'No Email Found'){
			await sendEmail(selectedEmpEmail[0].emailid, subject, htmlContent, 0);
		}
	} catch (error) {
        console.error(`Failed to send new email to ${empEmail[0].emailid}:`, error);
    }
}

exports.edit1 = async (req, res) => {
    let {travel_id,empname,emptype,typeofvisit,purpose,place,departure_date,arrival_date,currency_type,top_up_amount,advance_cash,is_group,created_date,selectedprojectids,taxi_req,selectedempids,acc_type,acc_days,landmark,room_type,taxi_type,start_place,end_place,starttime,endplace} = req.body;
    // Username Empty Validation
    if (!empname) {
        return res.status(400).json({success:false,message: 'Employee name is required' });
    }  
	
    const data = await businessRequestModel.edit({travel_id,empname,emptype,typeofvisit,purpose,place,departure_date,arrival_date,currency_type,top_up_amount,taxi_req,advance_cash,is_group,created_date,selectedprojectids,selectedempids,acc_type,acc_days,landmark,room_type,taxi_type,start_place,end_place,starttime,endplace});     
    return res.status(200).json({ success:true,message:'Business Travel Request updated.'});
};

exports.delete = async (req, res) => {
    const { travel_id } = req.body;
    // Username Empty Validation
    if (!travel_id) {
        return res.status(400).json({success:false,message: 'Travel ID is required' });
    }
	
    console.log(travel_id)	
	deleteEmail(travel_id)
    const data = await businessRequestModel.delete({Travel_id:travel_id});     
    return res.status(200).json({ success:true,message:'Business Travel Request deleted.'});
};

async function deleteEmail(travel_id) {
	try{
		const subject = 'BTP Portal - Request Deleted.';
		const formatTravelId = (num) => `TID_${num.toString().padStart(4, '0')}`;
		const htmlContent = `
			<p>Dear Employee,</p>
			<p>Your Business Travel Plan request deleted ${formatTravelId(travel_id)}.</p>
			<p>Thank you,</p>
			<p>BTP 1.0</p>
			<p><a href="http://192.168.0.20">192.168.0.20</a></p>
		`;
		//Employee Email
		const empEmail = await businessRequestModel.getEmpEmail(travel_id);
		const mgrEmail = await businessRequestModel.getManagerEmail(travel_id);
		const selectedEmpEmail = await businessRequestModel.getSelectedEmpEmail(travel_id);

		if (!empEmail) {
			console.log('No email found');
			return;
		}
		//Employee Email
		await sendEmail(empEmail[0].emailid, subject, htmlContent, 0);
		//await sendEmail(mgrEmail[0].emailid, subject, htmlContent, 0);
		if(selectedEmpEmail[0].emailid != 'No Email Found'){
			await sendEmail(selectedEmpEmail[0].emailid, subject, htmlContent, 0);
		}
	} catch (error) {
        console.error(`Failed to send new email to ${empEmail[0].emailid}:`, error);
    }
}

//exports.viewApproval = async (req, res) => {
    //const { travel_id } = req.query;
	//console.log("View");
    // Username Empty Validation
    //if (!travel_id) {
    //    return res.status(400).json({success:false,message: 'Travel ID is required' });
    //}    
    //const data = await businessRequestModel.viewApproval({travel_id:travel_id});     
    //return res.status(200).json({ success:true,message:'Business Travel Request View.'});
//};


exports.viewApproval = async (req, res) => {
    // ✅ For GET, only query params will work reliably
    const travel_id = req.query.travel_id || req.body.travel_id;
    console.log("View:", travel_id);

    if (!travel_id) {
        return res.status(400).json({
            success: false,
            message: 'Travel ID is required'
        });
    }
    try {
        const result = await businessRequestModel.viewApproval({ travel_id });
        //const responseData = {
            //selectedEmpid: result.recordsets[0]?.[0]?.Selected_Empid || null,
            //pid: result.recordsets[1]?.[0]?.Pid || null,
            //name: result.recordsets[2] || [],
            //travelDetails: result.recordsets[3] || [],
            //taxiDetails: result.recordsets[4] || []
        //};
		const responseData = {
            employeeInfo: result.recordsets[0]?.map(item => ({
                selectedEmpid: item.Selected_Empid || null,
                isGroup: item.Is_Group || 0
            })) || [],
	
            selectedEmployeeInfo: result.recordsets[1]?.map(item => ({
                Empid: item.Empid || 0,
                EmpName: item.EmpName || null
            })) || [],
 
            projectInfo: result.recordsets[2]?.map(item => ({
                pid: item.Pid || null
            })) || [],
 
            employeeDetails: result.recordsets[3]?.map(item => ({
                empName: item.Emp_Name || null,
                empId: item.Emp_id
            })) || [],
 
        travelDetails: result.recordsets[4],
 
    accommodationDetails: result.recordsets[5]?.map(item => ({
        placeoforigin: item.Place || null,
        placeofarrival: item.EndPlace || null,
        departure_date:item.Departure_Date,
        aeparture_date:item.Arrival_Date,
        accDays: item.Acc_Days || 0,
        landmark: item.Landmark || null,
        roomType: item.Room_Type || null,
        taxiReq: item.Taxi_Req || null,
        taxiType: item.Taxi_Type || null,
        startPlace: item.Start_place || null,
        endPlace: item.End_place || null,
        startTime: item.Starttime || null,
		index: item.index || 0
    })) || [],
	reject: result.recordsets[6]||[]
};
        return res.status(200).json({
            success: true,
            message: 'Business Travel Request View.',
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching approval view:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching business travel request view.',
            error: error.message
        });
    }
};
exports.viewApproval1 = async (req, res) => {
    // ✅ For GET, only query params will work reliably
    const travel_id = req.query.travel_id || req.body.travel_id;
    console.log("View:", travel_id);

    if (!travel_id) {
        return res.status(400).json({
            success: false,
            message: 'Travel ID is required'
        });
    }
    try {
        const result = await businessRequestModel.viewApproval({ travel_id });
        //const responseData = {
            //selectedEmpid: result.recordsets[0]?.[0]?.Selected_Empid || null,
            //pid: result.recordsets[1]?.[0]?.Pid || null,
            //name: result.recordsets[2] || [],
            //travelDetails: result.recordsets[3] || [],
            //taxiDetails: result.recordsets[4] || []
        //};
		const responseData = {
    employeeInfo: result.recordsets[0]?.map(item => ({
        selectedEmpid: item.Selected_Empid || null,
        isGroup: item.Is_Group || 0
    })) || [],
	
	projectInfo: result.recordsets[1]?.map(item => ({
        Empid: item.Empid || null,
		EmpName: item.EmpName || null
    })) || [],
 
    projectInfo: result.recordsets[2]?.map(item => ({
        pid: item.Pid || null
    })) || [],
 
    employeeDetails: result.recordsets[3]?.map(item => ({
        empName: item.Emp_Name || null
    })) || [],
 
    travelDetails: result.recordsets[4]?.map(item => ({
        typeOfVisit: item.Typeofvisit || null,
        purpose: item.Purpose || null,
        place: item.Place || null,
        departureDate: item.Departure_Date || null,
        arrivalDate: item.Arrival_Date || null,
        currencyType: item.Currency_Type || null,
        topUpAmount: item.Top_Up_Amount || 0,
        advanceCash: item.Advance_Cash || 0,
        empType: item.Emp_Type || null
    })) || [],
 
    accommodationDetails: result.recordsets[5]?.map(item => ({
        accDays: item.Acc_Days || 0,
        landmark: item.Landmark || null,
        roomType: item.Room_Type || null
    })) || [],
 
    taxiDetails: result.recordsets[6]?.map(item => ({
        taxiReq: item.Taxi_req || null,
        taxiType: item.Taxi_Type || null,
        startPlace: item.Start_place || null,
        endPlace: item.End_place || null,
        startTime: item.Starttime || null
    })) || []
};
        return res.status(200).json({
            success: true,
            message: 'Business Travel Request View.',
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching approval view:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching business travel request view.',
            error: error.message
        });
    }
};

exports.approve = async (req, res) => {
    try {
        const { travel_id, manager_id, department,empname, typeofvisit,reason } = req.body;

        
		let result;
		let dpt;
		
		const mgrStatus = await businessRequestModel.ticketStatus(travel_id);		
		
		if(department == 'CEO' && mgrStatus?.[0].Status == 'Approved' && mgrStatus?.[0].Typeofvisit == '1'){
			console.log('CEO')
			dpt = 'CEO';
			 // Call the model layer
			result = await businessRequestModel.approveByCeo({
				ticketID: travel_id,
			});
			
		}else if(department == 'Finance' && mgrStatus?.[0].Status == 'Approved' && mgrStatus?.[0].Typeofvisit == '1'){
			console.log('Finance')
			dpt = 'Finance';
			// Call the model layer
			result = await businessRequestModel.approveByFinance({
				ticketID: travel_id,
			});
		}else{ // Manager Approval
			// Call the model layer
			console.log('Manager')
			dpt = 'Manager';
			result = await businessRequestModel.approve({
				ticketID: travel_id,   // ✅ Match model parameter name
				ManagerID: manager_id
			});
		}
        // If no rows updated, return 404
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: 'Travel request not found or already approved.' });
        }
		domesticApproveEmail(travel_id, dpt, empname, typeofvisit, 'approved',reason);
        // Success
        return res.json({ success: true, message: 'Business travel request approved successfully.' });

    } catch (error) {
        console.error('❌ Error in approve controller:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

async function domesticApproveEmail(travel_id, dpt, empname, typeofvisit, action, reason) {
	try{
		const subject = `BTP Portal - Request ${action}.`;
		const formatTravelId = (num) => `TID_${num.toString().padStart(4, '0')}`;
		let htmlContent;
		dpt = (dpt == 'CEO') ? 'CEO' : (dpt == 'Finance') ? 'Finance' : 'Manager';
		
		if(action == 'approved'){
			htmlContent = `
				<p>Dear Employee,</p>
				<p>Request of Business Travel plan of  ${empname} - ${formatTravelId(travel_id)} is approved by ${dpt}.</p><p>You shall view by logging into BTP portal.</p>
				<p>Thank you,</p>
				<p>BTP 1.0</p>
				<p><a href="http://192.168.0.20">www.delopt.co.in</a></p>
			`;
		}else{
			htmlContent = `
				<p>Dear Employee,</p>
				<p>Request of Business Travel plan of  ${empname} - ${formatTravelId(travel_id)} is rejected by ${dpt}.</p><p>Reason: ${reason}</p><p>You shall view by logging into BTP portal.</p>
				<p>Thank you,</p>
				<p>BTP 1.0</p>
				<p><a href="http://192.168.0.20">www.delopt.co.in</a></p>
			`;
		}
		
		if(dpt == 'CEO'){
			//await sendEmail("shekar.gj@delopt.co.in", subject, htmlContent, 0);
			await sendEmail("santhakumar9399@gmail.com", subject, htmlContent, 0);
		}
		if(dpt == 'Finance'){
			//await sendEmail("sbaroth@delopt.co.in", subject, htmlContent, 0);
			await sendEmail("yuvaraj.rajendrandp@gmail.com", subject, htmlContent, 0);
		}
		//Employee Email
		const empEmail = await businessRequestModel.getEmpEmail(travel_id);
		const mgrEmail = await businessRequestModel.getManagerEmail(travel_id);
		const selectedEmpEmail = await businessRequestModel.getSelectedEmpEmail(travel_id);

		if (!empEmail) {
			console.log('No email found');
			return;
		}
		//Employee Email
		await sendEmail(empEmail[0].emailid, subject, htmlContent, 0);
		await sendEmail(mgrEmail[0].emailid, subject, htmlContent, 0);
		if(selectedEmpEmail[0].emailid != 'No Email Found'){
			await sendEmail(selectedEmpEmail[0].emailid, subject, htmlContent, 0);
		}
		//Default Email
		if(typeofvisit == 0){console.log('Domestic')}else{console.log('International')}
	} catch (error) {
        console.error(`Failed to send new email to:`, error);
    }
}


exports.reject = async (req, res) => {
    try {
        const { travel_id, manager_id, department,empname, typeofvisit,reason } = req.body;

        if (!travel_id) {
            return res.status(400).json({ success: false, message: 'Travel ID is required.' });
        }
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
        }

        await businessRequestModel.reject({ travel_id, reason });
		await businessRequestModel.reject1({ travel_id });
		domesticApproveEmail(travel_id, department, empname, typeofvisit, 'rejected',reason);
        return res.json({
            success: true,
            message: 'Business Travel Request rejected successfully.'
        });
    } catch (error) {
        console.error('❌ Error in reject controller:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};



exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword, emp_name } = req.body;

        if (!oldPassword?.trim())
            return res.status(400).json({ success:false, message:'Old Password is required' });

        if (!newPassword?.trim())
            return res.status(400).json({ success:false, message:'New Password is required' });

        if (!confirmPassword?.trim())
            return res.status(400).json({ success:false, message:'Confirm Password is required' });

        if (newPassword !== confirmPassword)
            return res.status(400).json({ success:false, message:'Passwords do not match' });

        // ✅ MUST await
        const user = await businessRequestModel.createdBy(emp_name);

        if (!user || !user.Password)
            return res.status(404).json({ success:false, message:'User not found' });

        // Decrypt stored password
        const decryptedPassword = decryptData(user.Password);

        if (!decryptedPassword)
            return res.status(500).json({ success:false, message:'Password decryption failed' });

        // ✅ Compare old password
        if (oldPassword != decryptedPassword)
            return res.status(401).json({ success:false, message:'Old password incorrect' });

        // Encrypt & update
        const encryptedNewPassword = encryptData(newPassword);

        await businessRequestModel.updatePassword({
            passwd: encryptedNewPassword,
            empid: user.Emp_id
        });

        return res.json({ success:true, message:'Password updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success:false, message:'Internal Server Error' });
    }
};


