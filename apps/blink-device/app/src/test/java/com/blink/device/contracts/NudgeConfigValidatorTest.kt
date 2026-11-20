package com.blink.device.contracts

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class NudgeConfigValidatorTest {
    private val contractsDirectory =
        File(requireNotNull(System.getProperty("contracts.dir")))

    private fun validator(): NudgeConfigValidator {
        val schema = File(
            contractsDirectory,
            "schemas/nudge-config.v1.schema.json"
        )
        return NudgeConfigValidator(schema.inputStream())
    }

    @Test
    fun acceptsValidExample() {
        val example = File(
            contractsDirectory,
            "examples/nudge-config.v1.valid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isEmpty())
    }

    @Test
    fun rejectsInvalidExample() {
        val example = File(
            contractsDirectory,
            "examples/nudge-config.v1.invalid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isNotEmpty())
    }
}
