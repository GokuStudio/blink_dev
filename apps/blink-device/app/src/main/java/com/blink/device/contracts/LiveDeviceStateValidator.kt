package com.blink.device.contracts

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion

class LiveDeviceStateValidator(schemaStream: java.io.InputStream) {
    private val mapper = ObjectMapper()
    private val schema: JsonSchema = schemaStream.use {
        JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7).getSchema(it)
    }

    fun errorsFor(json: String): Set<String> =
        schema.validate(mapper.readTree(json)).map { it.message }.toSet()
}
