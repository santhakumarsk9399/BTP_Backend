const { sql, poolPromise } = require('../Utility/dbConfig');

exports.gridData = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Employeename', sql.NVarChar(150), userData.empname);
        const result = await request.execute('BTP_Form_Status');
        return result.recordsets;            
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.ticketID = async () => {
    try{
        const pool = await poolPromise;
        const result = await pool.request()
                    .query("SELECT IDENT_CURRENT('Mtb_Travel')+1 AS CurrentIdentityValue");
        return result.recordset[0];
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.employees = async (EmployeeName) => {
    try{
        const pool = await poolPromise;
        const result = await pool.request()
                        .input('EmployeeName', sql.NVarChar, EmployeeName)
                        .query("SELECT Emp_id, Emp_name, Department FROM Mtb_Employee WHERE Emp_name != @EmployeeName  ORDER BY Emp_id ASC");
        return result.recordsets;
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.ticketStatus = async (ticketID) => {
    try{
        const pool = await poolPromise;
        const result = await pool.request()
                        .input('ticketID', sql.Int, ticketID)
                        .query("SELECT Typeofvisit, Status FROM Mtb_Travel WHERE travel_id = @ticketID");
        return result.recordset;
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.employeeteam = async (EmployeeName) => {
    try{
        const pool = await poolPromise;
        const request = await pool.request()
                        .input('EmployeeName', sql.NVarChar, EmployeeName)
        const result = await request.execute('SP_BTP_employee_team');
        return result.recordsets;
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.createdBy = async (empname) => {
    try{
        const pool = await poolPromise;
        const result = await pool.request()
                    .input('Emp_name', sql.NVarChar, empname)
                    .query("SELECT Emp_id,Password FROM Mtb_Employee WHERE  Emp_name = @Emp_name");
        return result.recordset[0];
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.getManagerEmail = async (travel_id) => {
    try{
        const pool = await poolPromise;
        const result = await pool.request()
                    .input('Travel_id', sql.Int, travel_id)
                    .query("Select emailid from Mtb_Employee where Emp_id in (Select Manager_id from Mtb_Employee where Emp_id in (select Emp_id from [dbo].[Tb_Selected_Employee] where Travel_id = @Travel_id))");
        return result.recordset;
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.getSelectedEmpEmail = async (travel_id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Travel_id', sql.Int, travel_id)
            .query(`
                SELECT 
                    ISNULL(STRING_AGG(emailid, ';'), 'No Email Found') AS emailid
                FROM Mtb_Employee
                WHERE Emp_id IN (
                    SELECT DISTINCT SelectedEmpids
                    FROM dbo.Tb_Selected_Employee
                    WHERE Travel_id = @Travel_id
                )
            `);
        return result.recordset;
    } catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);
        throw error;
    }
};


exports.getEmpEmail = async (travel_id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Travel_id', sql.Int, travel_id)
            .query(`
                SELECT emailid 
                FROM Mtb_Employee 
                WHERE Emp_id = (
                    SELECT DISTINCT Emp_id 
                    FROM Tb_Selected_Employee 
                    WHERE Travel_id = @Travel_id
                )
            `);

        return result.recordset; // 👈 single object
    } catch (error) {
        console.error('Error occurred:', error.message);
        throw error;
    }
};


exports.create = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Employeename', sql.NVarChar, userData.empname);
                        request.input('emptype', sql.Int, userData.emptype);
                        request.input('Typeofvisit', sql.NVarChar, userData.typeofvisit);
                        request.input('Purpose', sql.NVarChar, userData.purpose);
                        request.input('Currency_Type', sql.NVarChar, userData.currency_type);
						request.input('ModeOfTravel', sql.NVarChar, userData.mot);
                        request.input('Top_Up_Amount', sql.Int, userData.top_up_amount);
                        request.input('Advance_Cash', sql.Int, userData.advance_cash);
                        request.input('Is_Group', sql.Int, userData.is_group);
                        request.input('Created_Date', sql.DateTime, userData.created_date);
        const result = await request.execute('SP_BTP_ApprovalForm');
        return result.recordset[0];
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.selectedemployeeids = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
                        // Always specify column names explicitly
                        await request
                            .input('Travel_id', sql.Int, userData.travel_id)
                            .input('Emp_id', sql.Int, userData.emp_id)
                            .input('SelectedEmpids', sql.NVarChar, String(userData.empids))
                            .query(`INSERT INTO Tb_Selected_Employee (Travel_id, Emp_id, SelectedEmpids) VALUES (@Travel_id, @Emp_id, @SelectedEmpids)`);
                        return { success: true, message: 'Project inserted successfully.' };
    } catch (error) {
        console.error('Error occurred in selectedprojectids:', error.message);
        console.error(error.stack);
        throw error;
    }
};

exports.selectedprojectids = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
                        // Always specify column names explicitly
                        await request
                            .input('Travel_id', sql.Int, userData.travel_id)
                            .input('ProjectName', sql.NVarChar, userData.projectname)
                            .query(`INSERT INTO Tb_Selected_Project (Travel_id, SelectedProjectids) VALUES (@Travel_id, @ProjectName)`);
                        return { success: true, message: 'Project inserted successfully.' };
    } catch (error) {
        console.error('Error occurred in selectedprojectids:', error.message);
        console.error(error.stack);
        throw error;
    }
};        

exports.accomdations = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Travel_id', sql.Int, userData.travel_id);
                        request.input('PlaceofOrigin', sql.NVarChar, userData.placeoforigin);
                        request.input('PlaceofArrival', sql.NVarChar, userData.placeofarrival);
                        request.input('Departure_Date', sql.NVarChar, userData.departure_date);
                        request.input('Arrival_Date', sql.NVarChar, userData.arrival_date);
                        request.input('SelectedProjectids', sql.NVarChar, userData.selectedprojectids);
                        request.input('Acc_Type', sql.NVarChar, userData.acc_type);
                        request.input('Acc_Days', sql.NVarChar, userData.acc_days); 
                        request.input('Landmark', sql.NVarChar, userData.landmark);
                        request.input('Room_Type', sql.NVarChar, userData.room_type);
                        request.input('Taxi_Req', sql.NVarChar, userData.taxi_req);
                        request.input('Taxi_Type', sql.NVarChar, userData.taxi_type);
                        request.input('Start_place', sql.NVarChar, userData.start_place);
                        request.input('End_place', sql.NVarChar, userData.end_place);
                        request.input('Starttime', sql.NVarChar, userData.starttime);
						request.input('index', sql.Int, userData.index);
        const result = await request.execute('SP_BTP_ApprovalForm_Add');
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.edit = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Travel_id', sql.Int, userData.travel_id);
                        request.input('Employeename', sql.NVarChar, userData.empname);
                        request.input('emptype', sql.Int, userData.emptype);
                        request.input('Typeofvisit', sql.NVarChar, userData.typeofvisit);
                        request.input('Purpose', sql.NVarChar, userData.purpose);
                        request.input('Currency_Type', sql.NVarChar, userData.currency_type);
                        request.input('Top_Up_Amount', sql.Int, userData.top_up_amount);
                        request.input('Advance_Cash', sql.Int, userData.advance_cash);
                        request.input('Is_Group', sql.Int, userData.is_group);
						request.input('ModeOfTravel', sql.NVarChar, userData.mot);
        await request.execute('SP_BTP_Update_ApprovalForm');        
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.edit1 = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
						request.input('Travel_id', sql.Int, userData.travel_id);
                        request.input('Employeename', sql.NVarChar(150), userData.empname);
						request.input('emptype', sql.Int, userData.emptype);						
                        request.input('Typeofvisit', sql.NVarChar, userData.typeofvisit);
                        request.input('Purpose', sql.NVarChar, userData.purpose);
                        request.input('Place', sql.NVarChar, userData.place);
                        request.input('Departure_Date', sql.NVarChar, userData.departure_date);
                        request.input('Arrival_Date', sql.NVarChar, userData.arrival_date);
                        request.input('Currency_Type', sql.NVarChar, userData.currency_type);
                        request.input('Top_Up_Amount', sql.Int, userData.top_up_amount);
                        request.input('Advance_Cash', sql.Int, userData.advance_cash);
                        request.input('Is_Group', sql.Int, userData.is_group);
						request.input('Taxi_Req', sql.NVarChar, userData.taxi_req);
                        request.input('Created_Date', sql.DateTime, userData.created_date);
                        request.input('SelectedProjectids', sql.NVarChar, userData.selectedprojectids);
                        request.input('SelectedEmpids', sql.NVarChar, userData.selectedempids);
                        request.input('Acc_Type', sql.NVarChar, userData.acc_type);
                        request.input('Acc_Days', sql.NVarChar, userData.acc_days);
                        request.input('Landmark', sql.NVarChar, userData.landmark);
                        request.input('Room_Type', sql.NVarChar, userData.room_type);
                        request.input('Taxi_Type', sql.NVarChar, userData.taxi_type);
                        request.input('Start_place', sql.NVarChar, userData.start_place);
                        request.input('End_place', sql.NVarChar, userData.end_place);
                        request.input('Starttime', sql.NVarChar, userData.starttime);
						request.input('Endplace', sql.NVarChar, userData.endplace);
        await request.execute('SP_BTP_Update_ApprovalForm');
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.delete = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Travel_id', sql.Int, userData.Travel_id);
        await request.execute('SP_BTP_Delete_ApprovalForm');
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.viewApproval = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('Travel_id', sql.Int, userData.travel_id);
        //await request.execute('SP_BTP_ViewApprovalForm');
		const result = await request.execute('SP_BTP_ViewApprovalForm');

        return result;
		
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.approve = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Parameterized inputs to prevent SQL injection
        request.input('ManagerID', sql.Int, userData.ManagerID);
        request.input('TicketID', sql.Int, userData.ticketID);

        const query = `
            UPDATE Mtb_Travel
            SET 
                Approved_By = @ManagerID,
                Approved_Date = GETDATE(),
                Status = 'Approved'
            WHERE Travel_id = @TicketID;
        `;

        const result = await request.query(query);

        // Return the number of rows affected for better debugging
        return { rowsAffected: result.rowsAffected[0] };

    } catch (error) {
        console.error('❌ Error occurred in approve():', error.message);
        console.error(error.stack);  // Logs filename & line number in stack trace
        throw error;
    }
};

exports.approveByFinance = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Parameterized inputs to prevent SQL injection        
        request.input('TicketID', sql.Int, userData.ticketID);

        const query = `
            UPDATE Mtb_Travel
            SET                 
                finance_approval_status = 'Approved'
            WHERE Travel_id = @TicketID;
        `;

        const result = await request.query(query);

        // Return the number of rows affected for better debugging
        return { rowsAffected: result.rowsAffected[0] };

    } catch (error) {
        console.error('❌ Error occurred in approve():', error.message);
        console.error(error.stack);  // Logs filename & line number in stack trace
        throw error;
    }
};

exports.approveByCeo = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Parameterized inputs to prevent SQL injection        
        request.input('TicketID', sql.Int, userData.ticketID);

        const query = `
            UPDATE Mtb_Travel
            SET                 
                ceo_approval_status = 'Approved'
            WHERE Travel_id = @TicketID;
        `;

        const result = await request.query(query);

        // Return the number of rows affected for better debugging
        return { rowsAffected: result.rowsAffected[0] };

    } catch (error) {
        console.error('❌ Error occurred in approve():', error.message);
        console.error(error.stack);  // Logs filename & line number in stack trace
        throw error;
    }
};


exports.reject = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        await request
            .input('Travel_id', sql.Int, userData.travel_id)
            .input('Reason', sql.NVarChar(500), String(userData.reason))
            .query(`
                INSERT INTO Tb_Rejection_Track (Travel_id, Reason, CtDateTime)
                VALUES (@Travel_id, @Reason, GETDATE())
            `);
        return { success: true, message: 'Rejection reason recorded successfully.' };
    } catch (error) {
        console.error('❌ Error occurred in reject model:', error.message);
        console.error(error.stack);
        throw error;
    }
};

exports.reject1 = async (userData) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        await request
            .input('Travel_id', sql.Int, userData.travel_id)
            .query(`update Mtb_Travel set Status = 'Rejected',ceo_approval_status = 'Pending',finance_approval_status = 'Pending' WHERE Travel_id = @Travel_id`);

        return { success: true, message: 'Rejection reason recorded successfully.' };
    } catch (error) {
        console.error('❌ Error occurred in reject model:', error.message);
        console.error(error.stack);
        throw error;
    }
};

// model.js
exports.updatePassword = async ({ passwd, empid }) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('passwd', sql.NVarChar, passwd)
            .input('emp_id', sql.Int, empid)
            .query("UPDATE Mtb_Employee SET Password = @passwd WHERE Emp_id = @emp_id");
    } catch (error) {
        console.error('DB Error:', error);
        throw error;
    }
};