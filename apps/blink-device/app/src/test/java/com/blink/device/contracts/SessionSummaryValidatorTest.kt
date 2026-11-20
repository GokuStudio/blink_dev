package com.blink.device.contracts

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class SessionSummaryValidatorTest {
    private val contractsDirectory =
        File(requireNotNull(System.getProperty("contracts.dir")))

    private fun validator(): SessionSummaryValidator {
        val schema = File(
            contractsDirectory,
            "schemas/session-summary.v1.schema.json"
        )
        return SessionSummaryValidator(schema.inputStream())
    }

    @Test
    fun acceptsValidExample() {
        val example = File(
            contractsDirectory,
            "examples/session-summary.v1.valid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isEmpty())
    }

    @Test
    fun rejectsInvalidExample() {
        val example = File(
            contractsDirectory,
            "examples/session-summary.v1.invalid.json"
        ).readText()

        assertTrue(validator().errorsFor(example).isNotEmpty())
    }
}
