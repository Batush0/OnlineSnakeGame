const {mysql} =  require('./MySql.js')
const Storages = {
    MySql: new mysql()
    
}
module.exports.Storages = Storages