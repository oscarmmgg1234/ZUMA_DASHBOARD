const {generate_pdf, get_json_employee_data, get_zuma_employees, insert_start_shift, insert_end_shift, generate_pdf_all, previewEndShift, previewStartShift,
transformEndShift, transformStartShift, removeShift, previewRemoveShift, addAssignment, previewEditAssignment, editAssignment} 
= require('../employee_api_wrapper')

class employee {
    async gen_pdf(args){
        return await generate_pdf(args);
    }
    async gen_pdf_all(args){
        return await generate_pdf_all(args);
    }
    e_json_data(args,callback){
        return callback(get_json_employee_data(args));
    }
    g_z_employees(callback){
        return callback(get_zuma_employees());
    }
    e_i_s_shift(args){
        insert_start_shift(args);
    }
    e_i_e_shift(args){
        insert_end_shift(args);
    }
    async prev_e_s(args,callback){
        return callback(await previewEndShift(args))
    }
    async prev_s_s(args, callback){
        return callback(await previewStartShift(args))
    }

    trans_e_s(args){
        transformEndShift(args);
    }

    trans_s_s(args){
        transformStartShift(args);
    }

    rm_shift(args){
        removeShift(args);
    }
    async prev_rm_shift (args,callback){
        return callback( await previewRemoveShift(args));
    }
    add_assign(args){
        addAssignment(args);
    }
    async prev_edit_assign(args,callback){
        return callback(await previewEditAssignment(args));
    }
    edit_assign(args){
        editAssignment(args);
    }
}

exports.employee = employee;