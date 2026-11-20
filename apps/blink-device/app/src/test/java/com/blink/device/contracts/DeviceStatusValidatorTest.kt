package com.blink.device.contracts

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class DeviceStatusValidatorTest {
    private val contractsDirectory =
        File(requireNotNull(System.getProperty("contracts.dir")))

    private fun validator(): DeviceStatusValidator {
        val schema = File(
            contractsDirectory,
            "schemas/device-status.v1.schema.json"
        )
        return DeviceStatusValidator(schema.inputStream())
    }

    @Test
    fun acceptsValidExample() {
        val example = File(
            contractsDirectory,
            "examples/device-status.v1.valid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isEmpty())
    }

    @Test
    fun rejectsInvalidExample() {
        val example = File(
            contractsDirectory,
            "examples/device-status.v1.invalid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isNotEmpty())
    }
}
