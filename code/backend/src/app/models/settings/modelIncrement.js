const mongoose = require("mongoose");

const ModelIncrementSchema = new new mongoose.Schema({
    model: {type: String, required: true, index: {unique: true}},
    idx: {type: Number, default: 0}
})();

ModelIncrementSchema.statics.getNextId = async function (modelName, callback) {
    let incr = await this.findOne({model: modelName});

    if (!incr) incr = await new this({model: modelName}).save();
    incr.idx++;
    incr.save();
    return incr.idx;
};

ModelIncrementSchema.statics.setNextId = async function (modelName, callback) {
    let incr = await this.findOne({model: modelName});

    if (!incr) incr = await new this({model: modelName}).save();
    incr.idx++;
    incr.save();
    return incr.idx;
};

const ModelIncrement = mongoose.model("ModelIncrement", ModelIncrementSchema);

module.exports = ModelIncrement;
